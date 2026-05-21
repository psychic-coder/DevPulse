import { Injectable, Logger } from '@nestjs/common';
import { OsFinderCacheService } from './os-finder-cache.service';
import { RepoHealthFlags } from '../../packages/shared-types/os-finder.types';

export class GithubRateLimitError extends Error {
  constructor(public readonly resetTime: number) {
    super('GitHub API Rate Limit Threshold reached');
    this.name = 'GithubRateLimitError';
  }
}

@Injectable()
export class RepoHealthService {
  private readonly logger = new Logger(RepoHealthService.name);
  private readonly GITHUB_API_BASE = 'https://api.github.com';

  constructor(private readonly cacheService: OsFinderCacheService) {}

  private async fetchGithub(url: string, token: string): Promise<any> {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DevPulse Backend',
      },
    });

    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (remaining) {
      const remainingVal = parseInt(remaining, 10);
      if (remainingVal < 50) {
        const resetTime = reset ? parseInt(reset, 10) * 1000 : Date.now() + 60000;
        this.logger.warn(`GitHub API Rate limit low: ${remainingVal} remaining. Reset in ${Math.round((resetTime - Date.now()) / 1000)}s`);
        throw new GithubRateLimitError(resetTime);
      }
    }

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      if (response.status === 202) {
        // Contributor stats are compiling, return 202
        return { status: 202 };
      }
      throw new Error(`GitHub API call failed: ${response.status} ${response.statusText} on ${url}`);
    }

    return response.json();
  }

  async computeRepoHealth(
    owner: string,
    repo: string,
    token: string,
    repoDetails: any // passed in to save API calls since we get it from Search API
  ): Promise<RepoHealthFlags> {
    const cacheHit = await this.cacheService.getRepoHealth(owner, repo);
    if (cacheHit) {
      return cacheHit;
    }

    const healthFlags: RepoHealthFlags = {
      isArchived: false,
      isStale: false,
      noContributing: false,
      noReadme: false,
      lowPRMergeRate: false,
      forkHeavy: false,
      noExternalContribs: false,
      lowIssueEngagement: false,
      slowMaintainerResp: false,
    };

    try {
      // 1. isArchived (from search details)
      healthFlags.isArchived = !!repoDetails?.archived;

      // 2. isStale: pushed_at > 180 days ago
      const pushedTime = new Date(repoDetails?.pushed_at || repoDetails?.updated_at || Date.now()).getTime();
      const staleTime = 180 * 24 * 60 * 60 * 1000;
      healthFlags.isStale = (Date.now() - pushedTime) > staleTime;

      // 3. forkHeavy: forks > stars * 1.5 AND stars < 500
      const stars = repoDetails?.stargazers_count || repoDetails?.stars || 0;
      const forks = repoDetails?.forks_count || repoDetails?.forks || 0;
      healthFlags.forkHeavy = forks > (stars * 1.5) && stars < 500;

      // Fetch Community Profile (CONTRIBUTING, README, CoC)
      const communityProfile = await this.fetchGithub(
        `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/community/profile`,
        token
      );

      if (communityProfile) {
        healthFlags.noContributing = !communityProfile.files?.contributing;
        healthFlags.noReadme = !communityProfile.files?.readme;
      } else {
        // Fallback if not found
        healthFlags.noContributing = true;
        healthFlags.noReadme = true;
      }

      // Fetch recent closed PRs to compute lowPRMergeRate
      const closedPRStatsCache = await this.cacheService.getPRStats(owner, repo);
      let prStats = closedPRStatsCache;

      if (!prStats) {
        const closedPRs = await this.fetchGithub(
          `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=closed&per_page=30`,
          token
        );
        if (Array.isArray(closedPRs) && closedPRs.length > 0) {
          const mergedCount = closedPRs.filter(pr => pr.merged_at).length;
          const mergeRate = (mergedCount / closedPRs.length) * 100;
          prStats = { mergeRate };
          await this.cacheService.setPRStats(owner, repo, prStats);
        } else {
          prStats = { mergeRate: 100 }; // assume fine if no PRs
        }
      }

      healthFlags.lowPRMergeRate = prStats.mergeRate < 20;

      // Fetch contributor stats to compute noExternalContribs
      const contribStats = await this.fetchGithub(
        `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/stats/contributors`,
        token
      );

      if (Array.isArray(contribStats) && contribStats.length > 0) {
        const sortedContribs = contribStats
          .map((c: any) => c.total || 0)
          .sort((a: number, b: number) => b - a);

        const totalCommits = sortedContribs.reduce((sum: number, commits: number) => sum + commits, 0);
        if (totalCommits > 0) {
          const top3Commits = sortedContribs.slice(0, 3).reduce((sum: number, commits: number) => sum + commits, 0);
          healthFlags.noExternalContribs = (top3Commits / totalCommits) > 0.95;
        }
      }

      // Fetch closed issues to compute lowIssueEngagement and slowMaintainerResp
      const closedIssues = await this.fetchGithub(
        `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/issues?state=closed&per_page=20`,
        token
      );

      if (Array.isArray(closedIssues) && closedIssues.length > 0) {
        // filter out PRs
        const cleanIssues = closedIssues.filter(item => !item.pull_request);
        if (cleanIssues.length > 0) {
          const zeroCommentClosed = cleanIssues.filter(issue => (issue.comments || 0) === 0).length;
          healthFlags.lowIssueEngagement = (zeroCommentClosed / cleanIssues.length) > 0.60;

          // Compute average close time
          let totalCloseDays = 0;
          cleanIssues.forEach(issue => {
            const created = new Date(issue.created_at).getTime();
            const closed = new Date(issue.closed_at || Date.now()).getTime();
            totalCloseDays += (closed - created) / (1000 * 60 * 60 * 24);
          });
          const avgCloseDays = totalCloseDays / cleanIssues.length;
          healthFlags.slowMaintainerResp = avgCloseDays > 30;
        }
      }

      // Save to cache
      await this.cacheService.setRepoHealth(owner, repo, healthFlags);
    } catch (error) {
      if (error instanceof GithubRateLimitError) {
        throw error;
      }
      this.logger.error(`Error computing health for ${owner}/${repo}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return healthFlags;
  }
}
