import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository, Not, IsNull } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { SavedRepo } from './entities/saved-repo.entity';
import { OsFinderSearch } from './entities/os-finder-search.entity';
import { Commit } from '../github-sync/entities/commit.entity';
import { PullRequest } from '../github-sync/entities/pull-request.entity';
import { OsFinderCacheService } from './os-finder-cache.service';
import { RepoHealthService, GithubRateLimitError } from './repo-health.service';
import { NcfScorerService } from './ncf-scorer.service';
import { AiQueryBuilderService } from './ai-query-builder.service';
import { GitHubQueryBuilder } from './github-query-builder';
import { decryptToken } from '../common/utils/crypto.util';
import {
  OsFinderFilters,
  OsFinderRepoResult,
  OsFinderSearchResponse,
  NCFScoreBreakdown,
  RepoHealthFlags,
  SavedRepoStatus
} from '../../packages/shared-types/os-finder.types';
import { SearchQueryDto } from './dto/search-query.dto';
import { SaveRepoDto } from './dto/save-repo.dto';
import { UpdateSavedRepoDto } from './dto/update-saved-repo.dto';

@Injectable()
export class OsFinderService {
  private readonly logger = new Logger(OsFinderService.name);
  private readonly GITHUB_API_BASE = 'https://api.github.com';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: TypeOrmRepository<User>,
    @InjectRepository(SavedRepo)
    private readonly savedRepoRepository: TypeOrmRepository<SavedRepo>,
    @InjectRepository(OsFinderSearch)
    private readonly searchRepository: TypeOrmRepository<OsFinderSearch>,
    @InjectRepository(Commit)
    private readonly commitRepository: TypeOrmRepository<Commit>,
    @InjectRepository(PullRequest)
    private readonly pullRequestRepository: TypeOrmRepository<PullRequest>,
    private readonly cacheService: OsFinderCacheService,
    private readonly repoHealthService: RepoHealthService,
    private readonly ncfScorerService: NcfScorerService,
    private readonly aiQueryBuilderService: AiQueryBuilderService,
  ) {}

  private async fetchGithub(url: string, token: string): Promise<any> {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DevPulse Backend',
      },
    });

    if (response.status === 403 || response.status === 429) {
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const reset = response.headers.get('X-RateLimit-Reset');
      if (remaining && parseInt(remaining, 10) < 50) {
        const resetTime = reset ? parseInt(reset, 10) * 1000 : Date.now() + 60000;
        throw new GithubRateLimitError(resetTime);
      }
    }

    if (!response.ok) {
      throw new Error(`GitHub search failure: ${response.status} ${response.statusText} on ${url}`);
    }

    return response.json();
  }

  private async fetchGithubWithLanguages(
    filters: OsFinderFilters,
    userCtx: any,
    keywords?: string[]
  ): Promise<{ items: any[]; total_count: number }> {
    const langs = filters.languages && filters.languages.length > 0
      ? filters.languages
      : [];

    if (langs.length === 0) {
      const query = GitHubQueryBuilder.build({ ...filters, languages: [] }, userCtx, keywords);
      const res = await this.fetchGithub(
        `${this.GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(query)}&sort=updated&per_page=30`,
        userCtx.githubToken
      );
      return {
        items: res?.items || [],
        total_count: res?.total_count || 0
      };
    }

    const targetLangs = langs.slice(0, 3);
    const promises = targetLangs.map(async (lang) => {
      const query = GitHubQueryBuilder.build({ ...filters, languages: [lang] }, userCtx, keywords);
      try {
        const res = await this.fetchGithub(
          `${this.GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(query)}&sort=updated&per_page=30`,
          userCtx.githubToken
        );
        return {
          items: res?.items || [],
          total_count: res?.total_count || 0
        };
      } catch (err) {
        if (err instanceof GithubRateLimitError) {
          throw err;
        }
        this.logger.error(`Failed github search API query for language ${lang}: ${err instanceof Error ? err.message : String(err)}`);
        return { items: [], total_count: 0 };
      }
    });

    const results = await Promise.all(promises);

    const seenIds = new Set<number>();
    const mergedItems: any[] = [];
    let totalCount = 0;

    for (const res of results) {
      if (res && res.items) {
        totalCount += res.total_count || 0;
        for (const item of res.items) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            mergedItems.push(item);
          }
        }
      }
    }

    return {
      items: mergedItems.slice(0, 30),
      total_count: totalCount,
    };
  }

  // Step 2: Load user context (languages + avg PR score + inferred difficulty)
  async loadUserContext(userId: string): Promise<{
    topLanguages: string[];
    inferredLevel: string;
    avgPRScore: number;
    githubToken: string;
    githubUsername: string;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const token = decryptToken(user.githubToken);

    // Get languages from commits
    const commitLangs = await this.commitRepository
      .createQueryBuilder('commit')
      .innerJoinAndSelect('commit.repository', 'repository')
      .where('commit.userId = :userId', { userId })
      .andWhere('repository.language IS NOT NULL')
      .select('repository.language', 'language')
      .addSelect('COUNT(commit.id)', 'count')
      .groupBy('repository.language')
      .orderBy('count', 'DESC')
      .limit(3)
      .getRawMany();

    const topLanguages = commitLangs.map(cl => cl.language);

    // Inferred experience level and PR scores
    const prs = await this.pullRequestRepository.find({
      where: { userId, prScore: Not(IsNull()) },
    });
    const avgPRScore = prs.length > 0 ? prs.reduce((sum, pr) => sum + pr.prScore, 0) / prs.length : 0;

    // commits history in days
    const earliestCommit = await this.commitRepository.findOne({
      where: { userId },
      order: { committedAt: 'ASC' },
    });
    const commitHistoryDays = earliestCommit
      ? (Date.now() - new Date(earliestCommit.committedAt).getTime()) / (1000 * 60 * 60 * 24)
      : 0;

    let inferredLevel = 'beginner';
    if (commitHistoryDays >= 365 && avgPRScore > 7.5) {
      inferredLevel = 'advanced';
    } else if (commitHistoryDays >= 90 && avgPRScore >= 5.0) {
      inferredLevel = 'intermediate';
    }

    return {
      topLanguages,
      inferredLevel,
      avgPRScore,
      githubToken: token,
      githubUsername: user.githubUsername,
    };
  }

  // Main 14-step search orchestration
  async search(userId: string, queryDto: SearchQueryDto): Promise<OsFinderSearchResponse> {
    const userCtx = await this.loadUserContext(userId);

    // Setup filter options with DTO values or defaults
    const filters: OsFinderFilters = {
      languages: queryDto.languages || userCtx.topLanguages,
      languageMode: queryDto.languageMode || 'any_of',
      difficulty: queryDto.difficulty || (userCtx.inferredLevel as any),
      contributionTypes: queryDto.contributionTypes || [],
      domains: queryDto.domains || [],
      repoSize: queryDto.repoSize || 'any',
      lastCommitDays: queryDto.lastCommitDays !== undefined ? queryDto.lastCommitDays : 90,
      minOpenIssues: queryDto.minOpenIssues !== undefined ? queryDto.minOpenIssues : 3,
      issueFreshDays: queryDto.issueFreshDays !== undefined ? queryDto.issueFreshDays : 60,
      hasContributing: queryDto.hasContributing !== undefined ? queryDto.hasContributing : true,
      hasCodeOfConduct: queryDto.hasCodeOfConduct !== undefined ? queryDto.hasCodeOfConduct : false,
      licenseTypes: queryDto.licenseTypes || [],
      prMergeRate: queryDto.prMergeRate !== undefined ? queryDto.prMergeRate : 30,
      includeAlreadyContributed: queryDto.includeAlreadyContributed || false,
    };

    // Step 3: Check cache
    const cacheHit = await this.cacheService.getSearchResults(userId, filters);
    if (cacheHit) {
      this.logger.log(`Serving search results from cache for user ${userId}`);
      return cacheHit;
    }

    // Step 4-5-12: Execute search and handle relaxation loop
    let activeFilters = { ...filters };
    let githubQuery = GitHubQueryBuilder.build(activeFilters, userCtx);
    let rawResults: any = null;
    let filtersRelaxed: Partial<OsFinderFilters> | null = null;
    let relaxationNote: string | null = null;

    const relaxationOrder = [
      { field: 'lastCommitDays',  from: 90,   to: 180,  message: "last commit window relaxed to 180 days" },
      { field: 'minOpenIssues',   from: 3,    to: 1,    message: "minimum open issues relaxed to 1" },
      { field: 'issueFreshDays',  from: 60,   to: 180,  message: "issue freshness relaxed to 180 days" },
      { field: 'prMergeRate',     from: 30,   to: 10,   message: "PR merge rate threshold relaxed to 10%" },
      { field: 'hasContributing', from: true, to: false, message: "CONTRIBUTING.md requirement removed" },
    ];

    try {
      rawResults = await this.fetchGithubWithLanguages(activeFilters, userCtx);

      // Loop relaxation
      if ((!rawResults || rawResults.total_count < 3) && rawResults.items) {
        filtersRelaxed = {};
        const notes: string[] = [];

        for (const step of relaxationOrder) {
          const field = step.field as keyof OsFinderFilters;
          if (activeFilters[field] === step.from) {
            (activeFilters as any)[field] = step.to;
            (filtersRelaxed as any)[field] = step.to;
            notes.push(step.message);

            const retryRes = await this.fetchGithubWithLanguages(activeFilters, userCtx);

            if (retryRes && retryRes.total_count >= 3) {
              rawResults = retryRes;
              break;
            } else if (retryRes) {
              rawResults = retryRes;
            }
          }
        }

        if (notes.length > 0) {
          relaxationNote = `No repos matched all filters. We relaxed filters: ${notes.join('; ')}.`;
        }
      }
    } catch (err) {
      if (err instanceof GithubRateLimitError) {
        throw err;
      }
      this.logger.error(`Failed github search API query: ${err instanceof Error ? err.message : String(err)}`);
      rawResults = { items: [], total_count: 0 };
    }

    const items = rawResults?.items || [];

    // Load already-contributed repos
    const userPrs = await this.pullRequestRepository
      .createQueryBuilder('pr')
      .innerJoinAndSelect('pr.repository', 'repository')
      .where('pr.userId = :userId', { userId })
      .getMany();
    const userContributed = new Set(userPrs.map(pr => pr.repository?.fullName).filter(Boolean));

    // Load saved repos watchlist to flag isSaved
    const saved = await this.savedRepoRepository.find({ where: { userId } });
    const savedRepoIds = new Set(saved.map(s => Number(s.githubRepoId)));

    // Step 6: Parallel health check processing (Staggered Promise Pool)
    const processedResults = await this.processHealthAndNcfInParallel(
      items,
      userCtx.githubToken,
      userCtx.topLanguages,
      userContributed,
      savedRepoIds
    );

    // Apply filters and exclusions
    let results = processedResults;

    // Step 9: Already contributed exclusion
    if (!filters.includeAlreadyContributed) {
      results = results.filter(r => !r.alreadyContrib);
    }

    // Step 10: Overwhelming repos guard (Star > 100k)
    // If not advanced+large, push to bottom, or just split
    const majorRepos = results.filter(r => r.stars > 100000);
    const regularRepos = results.filter(r => r.stars <= 100000);

    // Sort regular repos: primary: (ncfScore * langMatchScore), secondary: lastCommitAt DESC
    regularRepos.sort((a, b) => {
      const scoreA = (a.ncfScore?.total || 0) * a.langMatchScore;
      const scoreB = (b.ncfScore?.total || 0) * b.langMatchScore;
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return new Date(b.lastCommitAt).getTime() - new Date(a.lastCommitAt).getTime();
    });

    // Concat regular then major repos
    const finalResults = [...regularRepos, ...majorRepos];

    const response: OsFinderSearchResponse = {
      results: finalResults,
      total: rawResults.total_count || 0,
      page: queryDto.page || 1,
      filtersApplied: filters,
      filtersRelaxed,
      relaxationNote,
      aiModeUsed: false,
    };

    // Step 13: Cache results
    await this.cacheService.setSearchResults(userId, filters, response);

    // Step 14: Log search asynchronously
    this.searchRepository.save({
      userId,
      queryText: null,
      filtersApplied: filters,
      resultCount: finalResults.length,
      aiQueryUsed: false,
      githubQuery,
    }).catch(err => this.logger.error(`Failed to log search query: ${err.message}`));

    return response;
  }

  // AI Search orchestrator
  async searchAi(userId: string, body: { query: string }): Promise<OsFinderSearchResponse> {
    const userCtx = await this.loadUserContext(userId);

    const { filters, keywords, fallbackUsed } = await this.aiQueryBuilderService.buildFilters(
      body.query,
      userCtx
    );

    const cacheHit = await this.cacheService.getSearchResults(userId, filters);
    if (cacheHit) {
      cacheHit.aiModeUsed = true;
      if (fallbackUsed) {
        cacheHit.relaxationNote = "AI query builder unavailable. Using keyword matching instead.";
      }
      return cacheHit;
    }

    let activeFilters = { ...filters };
    let githubQuery = GitHubQueryBuilder.build(activeFilters, userCtx, keywords);
    let rawResults: any = null;
    let filtersRelaxed: Partial<OsFinderFilters> | null = null;
    let relaxationNote: string | null = fallbackUsed ? "AI query builder unavailable. Using keyword matching instead." : null;

    try {
      rawResults = await this.fetchGithubWithLanguages(activeFilters, userCtx, keywords);
    } catch (err) {
      if (err instanceof GithubRateLimitError) {
        throw err;
      }
      this.logger.error(`Failed github search AI query: ${err instanceof Error ? err.message : String(err)}`);
      rawResults = { items: [], total_count: 0 };
    }

    const items = rawResults?.items || [];

    // Load already-contributed repos
    const userPrs = await this.pullRequestRepository
      .createQueryBuilder('pr')
      .innerJoinAndSelect('pr.repository', 'repository')
      .where('pr.userId = :userId', { userId })
      .getMany();
    const userContributed = new Set(userPrs.map(pr => pr.repository?.fullName).filter(Boolean));

    // Load saved repos
    const saved = await this.savedRepoRepository.find({ where: { userId } });
    const savedRepoIds = new Set(saved.map(s => Number(s.githubRepoId)));

    // Staggered promise health + NCF
    const processedResults = await this.processHealthAndNcfInParallel(
      items,
      userCtx.githubToken,
      userCtx.topLanguages,
      userContributed,
      savedRepoIds
    );

    let results = processedResults;
    if (!filters.includeAlreadyContributed) {
      results = results.filter(r => !r.alreadyContrib);
    }

    const majorRepos = results.filter(r => r.stars > 100000);
    const regularRepos = results.filter(r => r.stars <= 100000);

    regularRepos.sort((a, b) => {
      const scoreA = (a.ncfScore?.total || 0) * a.langMatchScore;
      const scoreB = (b.ncfScore?.total || 0) * b.langMatchScore;
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return new Date(b.lastCommitAt).getTime() - new Date(a.lastCommitAt).getTime();
    });

    const finalResults = [...regularRepos, ...majorRepos];

    const response: OsFinderSearchResponse = {
      results: finalResults,
      total: rawResults.total_count || 0,
      page: 1,
      filtersApplied: filters,
      filtersRelaxed: null,
      relaxationNote,
      aiModeUsed: true,
    };

    await this.cacheService.setSearchResults(userId, filters, response);

    this.searchRepository.save({
      userId,
      queryText: body.query,
      filtersApplied: filters,
      resultCount: finalResults.length,
      aiQueryUsed: true,
      githubQuery,
    }).catch(err => this.logger.error(`Failed to log search query: ${err.message}`));

    return response;
  }

  // Staggered parallel health + NCF processor (staggered queue)
  private async processHealthAndNcfInParallel(
    items: any[],
    token: string,
    topLanguages: string[],
    userContributed: Set<string>,
    savedRepoIds: Set<number>
  ): Promise<OsFinderRepoResult[]> {
    const results: OsFinderRepoResult[] = [];
    const activePromises: Promise<any>[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Concurrency limit = 10
      while (activePromises.length >= 10) {
        await Promise.race(activePromises);
      }

      // Stagger start: 200ms wait
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const promise = (async () => {
        const owner = item.owner.login;
        const repo = item.name;

        try {
          const healthFlags = await this.repoHealthService.computeRepoHealth(owner, repo, token, item);
          const ncfScore = await this.ncfScorerService.computeNCFScore(owner, repo, token, item);

          // Language match calculation (weights: Rank 1: 1.0, Rank 2: 0.6, Rank 3: 0.3)
          let langMatchScore = 0.0;
          if (item.language) {
            const index = topLanguages.indexOf(item.language);
            if (index === 0) langMatchScore = 1.0;
            else if (index === 1) langMatchScore = 0.6;
            else if (index === 2) langMatchScore = 0.3;
          }

          const alreadyContrib = userContributed.has(item.full_name);
          const isSaved = savedRepoIds.has(Number(item.id));

          return {
            githubRepoId: Number(item.id),
            owner,
            name: repo,
            fullName: item.full_name,
            description: item.description || null,
            language: item.language || null,
            stars: item.stargazers_count || 0,
            forks: item.forks_count || 0,
            openIssues: item.open_issues_count || 0,
            lastCommitAt: item.pushed_at || item.updated_at,
            licenseType: item.license?.name || item.license?.spdx_id || null,
            htmlUrl: item.html_url,
            ncfScore,
            langMatchScore,
            openLabels: ['good first issue', 'help wanted'], // labels we target
            healthFlags,
            isSaved,
            alreadyContrib,
          };
        } catch (err) {
          this.logger.warn(`Staggered health check failed for ${item.full_name}: ${err instanceof Error ? err.message : String(err)}`);
          // Default fallback results if rate limited
          return {
            githubRepoId: Number(item.id),
            owner,
            name: repo,
            fullName: item.full_name,
            description: item.description || null,
            language: item.language || null,
            stars: item.stargazers_count || 0,
            forks: item.forks_count || 0,
            openIssues: item.open_issues_count || 0,
            lastCommitAt: item.pushed_at || item.updated_at,
            licenseType: item.license?.name || item.license?.spdx_id || null,
            htmlUrl: item.html_url,
            ncfScore: {
              total: 0.0, // Health check pending
              goodFirstIssue: 0,
              helpWanted: 0,
              contributingFile: 0,
              issueResponseTime: 0,
              newContribPR: 0,
              readmeQuality: 0,
              codeOfConduct: 0,
              prMergeRate: 0,
            },
            langMatchScore: 0.0,
            openLabels: [],
            healthFlags: {
              isArchived: false,
              isStale: false,
              noContributing: false,
              noReadme: false,
              lowPRMergeRate: false,
              forkHeavy: false,
              noExternalContribs: false,
              lowIssueEngagement: false,
              slowMaintainerResp: false,
            },
            isSaved: savedRepoIds.has(Number(item.id)),
            alreadyContrib: userContributed.has(item.full_name),
          };
        }
      })();

      activePromises.push(promise);
      promise.then(res => {
        results.push(res);
        const idx = activePromises.indexOf(promise);
        if (idx > -1) {
          activePromises.splice(idx, 1);
        }
      });
    }

    await Promise.all(activePromises);
    return results;
  }

  // GET /os-finder/repo/:owner/:repo
  async getRepoDetail(userId: string, owner: string, repo: string): Promise<any> {
    const userCtx = await this.loadUserContext(userId);
    const token = userCtx.githubToken;

    const detailsUrl = `${this.GITHUB_API_BASE}/repos/${owner}/${repo}`;
    const repoDetails = await this.fetchGithub(detailsUrl, token);
    if (!repoDetails) {
      throw new NotFoundException(`GitHub Repository ${owner}/${repo} not found`);
    }

    const healthFlags = await this.repoHealthService.computeRepoHealth(owner, repo, token, repoDetails);
    const ncfScore = await this.ncfScorerService.computeNCFScore(owner, repo, token, repoDetails);

    // Fetch top 5 contributors
    const contributors = await this.fetchGithub(
      `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/contributors?per_page=5`,
      token
    ).catch(() => []);

    // Fetch last 5 merged PRs
    const recentPRs = await this.fetchGithub(
      `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=closed&per_page=15`,
      token
    ).catch(() => []);
    const mergedPRs = Array.isArray(recentPRs) ? recentPRs.filter(pr => pr.merged_at).slice(0, 5) : [];

    // Check if saved
    const saved = await this.savedRepoRepository.findOne({
      where: { userId, githubRepoId: repoDetails.id },
    });

    return {
      githubRepoId: repoDetails.id,
      owner: repoDetails.owner?.login,
      name: repoDetails.name,
      fullName: repoDetails.full_name,
      description: repoDetails.description,
      language: repoDetails.language,
      stars: repoDetails.stargazers_count,
      forks: repoDetails.forks_count,
      openIssues: repoDetails.open_issues_count,
      lastCommitAt: repoDetails.pushed_at || repoDetails.updated_at,
      licenseType: repoDetails.license?.name || repoDetails.license?.spdx_id || null,
      htmlUrl: repoDetails.html_url,
      ncfScore,
      healthFlags,
      contributors: Array.isArray(contributors) ? contributors.map(c => ({ login: c.login, avatarUrl: c.avatar_url, contributions: c.contributions })) : [],
      recentPRs: mergedPRs.map(pr => ({ id: pr.id, title: pr.title, url: pr.html_url, author: pr.user?.login, authorAvatar: pr.user?.avatar_url, mergedAt: pr.merged_at })),
      savedId: saved?.id || null,
      notes: saved?.notes || null,
      status: saved?.status || null,
    };
  }

  // GET /os-finder/repo/:owner/:repo/issues (beginner open issues list)
  async getRepoIssues(userId: string, owner: string, repo: string): Promise<any[]> {
    const userCtx = await this.loadUserContext(userId);
    // Fetch labels combined
    const labels = ['good first issue', 'help wanted'];
    
    // Check cache
    const cacheHit = await this.cacheService.getRepoIssues(owner, repo, labels);
    if (cacheHit) {
      return cacheHit;
    }

    const url = `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/issues?state=open&per_page=30`;
    const response = await this.fetchGithub(url, userCtx.githubToken);

    if (Array.isArray(response)) {
      // Filter out PRs, and retain ones matching labels
      const issues = response.filter(item => {
        if (item.pull_request) return false;
        const itemLabels = item.labels?.map((l: any) => l.name.toLowerCase()) || [];
        return itemLabels.some((l: string) => labels.includes(l));
      }).map(issue => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        commentsCount: issue.comments,
        labels: issue.labels?.map((l: any) => l.name) || [],
      }));

      await this.cacheService.setRepoIssues(owner, repo, labels, issues);
      return issues;
    }

    return [];
  }

  // POST /os-finder/saved (watchlist)
  async saveRepo(userId: string, dto: SaveRepoDto): Promise<SavedRepo> {
    let saved = await this.savedRepoRepository.findOne({
      where: { userId, githubRepoId: dto.githubRepoId },
    });

    if (!saved) {
      saved = this.savedRepoRepository.create({
        userId,
        githubRepoId: dto.githubRepoId,
        owner: dto.owner,
        name: dto.name,
        fullName: dto.fullName,
        description: dto.description || null,
        language: dto.language || null,
        stars: dto.stars || 0,
        forks: dto.forks || 0,
        openIssues: dto.openIssues || 0,
        ncfScore: dto.ncfScore && typeof dto.ncfScore === 'object' ? dto.ncfScore : null,
        langMatchScore: dto.langMatchScore || null,
        lastCommitAt: dto.lastCommitAt ? new Date(dto.lastCommitAt) : null,
        hasContributing: dto.hasContributing || false,
        licenseType: dto.licenseType || null,
        htmlUrl: dto.htmlUrl,
        notes: dto.notes || null,
        status: dto.status || 'saved',
      });
    } else {
      Object.assign(saved, {
        notes: dto.notes !== undefined ? dto.notes : saved.notes,
        status: dto.status || saved.status,
      });
    }

    const res = await this.savedRepoRepository.save(saved);
    await this.cacheService.invalidateSavedRepos(userId);
    return res;
  }

  // GET /os-finder/saved (watchlist)
  async getSavedRepos(userId: string): Promise<SavedRepo[]> {
    // Check cache
    const cacheHit = await this.cacheService.getSavedRepos(userId);
    if (cacheHit) {
      return cacheHit;
    }

    const list = await this.savedRepoRepository.find({
      where: { userId },
      order: { savedAt: 'DESC' },
    });

    await this.cacheService.setSavedRepos(userId, list);
    return list;
  }

  // PATCH /os-finder/saved/:id
  async updateSavedRepo(userId: string, id: string, dto: UpdateSavedRepoDto): Promise<SavedRepo> {
    const saved = await this.savedRepoRepository.findOne({ where: { id, userId } });
    if (!saved) {
      throw new NotFoundException(`Saved repo item ${id} not found`);
    }

    if (dto.notes !== undefined) {
      saved.notes = dto.notes;
    }
    if (dto.status !== undefined) {
      saved.status = dto.status;
    }

    const res = await this.savedRepoRepository.save(saved);
    await this.cacheService.invalidateSavedRepos(userId);
    return res;
  }

  // DELETE /os-finder/saved/:id
  async deleteSavedRepo(userId: string, id: string): Promise<void> {
    const saved = await this.savedRepoRepository.findOne({ where: { id, userId } });
    if (!saved) {
      throw new NotFoundException(`Saved repo item ${id} not found`);
    }

    await this.savedRepoRepository.remove(saved);
    await this.cacheService.invalidateSavedRepos(userId);
  }

  // GET /os-finder/history
  async getSearchHistory(userId: string): Promise<OsFinderSearch[]> {
    return this.searchRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }
}
