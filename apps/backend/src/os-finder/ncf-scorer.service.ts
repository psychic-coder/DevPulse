import { Injectable, Logger } from '@nestjs/common';
import { OsFinderCacheService } from './os-finder-cache.service';
import { NCFScoreBreakdown } from '../../packages/shared-types/os-finder.types';
import { GithubRateLimitError } from './repo-health.service';

@Injectable()
export class NcfScorerService {
  private readonly logger = new Logger(NcfScorerService.name);
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
        this.logger.warn(`GitHub API Rate limit low during NCF score compute: ${remainingVal} remaining. Reset in ${Math.round((resetTime - Date.now()) / 1000)}s`);
        throw new GithubRateLimitError(resetTime);
      }
    }

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`GitHub API NCF fetch failed: ${response.status} ${response.statusText} on ${url}`);
    }

    return response.json();
  }

  async computeNCFScore(
    owner: string,
    repo: string,
    token: string,
    _repoDetails: any
  ): Promise<NCFScoreBreakdown> {
    const breakdown: NCFScoreBreakdown = {
      total: 1.0, // base score
      goodFirstIssue: 0,
      helpWanted: 0,
      contributingFile: 0,
      issueResponseTime: 0,
      newContribPR: 0,
      readmeQuality: 0,
      codeOfConduct: 0,
      prMergeRate: 0,
    };

    try {
      let score = 0;

      // 1. Open and Fresh 'good first issue' labels (weight 25% = 2.5 pts)
      let goodFirstIssues = await this.cacheService.getRepoIssues(owner, repo, ['good first issue']);
      if (!goodFirstIssues) {
        goodFirstIssues = await this.fetchGithub(
          `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/issues?labels=good first issue&state=open&per_page=10`,
          token
        );
        if (goodFirstIssues) {
          await this.cacheService.setRepoIssues(owner, repo, ['good first issue'], goodFirstIssues);
        }
      }

      if (Array.isArray(goodFirstIssues) && goodFirstIssues.length > 0) {
        // Check for freshness: updated within 60 days
        const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
        const hasFresh = goodFirstIssues.some(
          issue => !issue.pull_request && new Date(issue.updated_at).getTime() > sixtyDaysAgo
        );
        if (hasFresh) {
          breakdown.goodFirstIssue = 2.5;
          score += 2.5;
        }
      }

      // 2. Has 'help wanted' labels (weight 10% = 1.0 pt)
      let helpWanted = await this.cacheService.getRepoIssues(owner, repo, ['help wanted']);
      if (!helpWanted) {
        helpWanted = await this.fetchGithub(
          `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/issues?labels=help wanted&state=open&per_page=5`,
          token
        );
        if (helpWanted) {
          await this.cacheService.setRepoIssues(owner, repo, ['help wanted'], helpWanted);
        }
      }

      if (Array.isArray(helpWanted) && helpWanted.length > 0) {
        breakdown.helpWanted = 1.0;
        score += 1.0;
      }

      // Fetch Community Profile & README metadata
      const communityProfile = await this.fetchGithub(
        `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/community/profile`,
        token
      );

      if (communityProfile) {
        // 3. CONTRIBUTING file (weight 15% = 1.5 pts)
        if (communityProfile.files?.contributing) {
          breakdown.contributingFile = 1.5;
          score += 1.5;
        }

        // 7. Code of Conduct present (weight 5% = 0.5 pts)
        if (communityProfile.files?.code_of_conduct) {
          breakdown.codeOfConduct = 0.5;
          score += 0.5;
        }
      }

      // 6. README quality: check word count proxy via README file size (weight 5% = 0.5 pts)
      const readmeMeta = await this.fetchGithub(
        `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/readme`,
        token
      );
      if (readmeMeta && readmeMeta.size > 2000) {
        breakdown.readmeQuality = 0.5;
        score += 0.5;
      }

      // 8. PR Merge Rate (weight 5% = 0.5 pts)
      const prStatsCache = await this.cacheService.getPRStats(owner, repo);
      let prStats = prStatsCache;
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
          prStats = { mergeRate: 100 };
        }
      }

      if (prStats.mergeRate > 50) {
        breakdown.prMergeRate = 0.5;
        score += 0.5;
      } else if (prStats.mergeRate > 30) {
        breakdown.prMergeRate = 0.25;
        score += 0.25;
      }

      // 4. Avg issue response time proxy: close time of closed issues (weight 20% = 2.0 pts)
      const closedIssues = await this.fetchGithub(
        `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/issues?state=closed&per_page=20`,
        token
      );

      let avgCloseDays = 999;
      if (Array.isArray(closedIssues) && closedIssues.length > 0) {
        const cleanIssues = closedIssues.filter(item => !item.pull_request);
        if (cleanIssues.length > 0) {
          let totalCloseDays = 0;
          cleanIssues.forEach(issue => {
            const created = new Date(issue.created_at).getTime();
            const closed = new Date(issue.closed_at || Date.now()).getTime();
            totalCloseDays += (closed - created) / (1000 * 60 * 60 * 24);
          });
          avgCloseDays = totalCloseDays / cleanIssues.length;
        }
      }

      if (avgCloseDays < 3) {
        breakdown.issueResponseTime = 2.0;
        score += 2.0;
      } else if (avgCloseDays < 7) {
        breakdown.issueResponseTime = 1.5;
        score += 1.5;
      } else if (avgCloseDays < 14) {
        breakdown.issueResponseTime = 1.0;
        score += 1.0;
      } else if (avgCloseDays < 30) {
        breakdown.issueResponseTime = 0.5;
        score += 0.5;
      }

      // 5. Recent merged PR from first time contributor (weight 15% = 1.5 pts)
      const closedPRs = await this.fetchGithub(
        `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=closed&per_page=20`,
        token
      );

      if (Array.isArray(closedPRs) && closedPRs.length > 0) {
        const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
        const newContribPR = closedPRs.find(pr => {
          if (!pr.merged_at) return false;
          const mergedTime = new Date(pr.merged_at).getTime();
          if (mergedTime < sixtyDaysAgo) return false;
          // check association
          return pr.author_association === 'FIRST_TIME_CONTRIBUTOR' || pr.author_association === 'NONE';
        });

        if (newContribPR) {
          breakdown.newContribPR = 1.5;
          score += 1.5;
        }
      }

      // Scale final score: base score of 1.0 up to a maximum of 10.0
      breakdown.total = Math.max(1.0, Math.min(score, 10.0));
    } catch (error) {
      if (error instanceof GithubRateLimitError) {
        throw error;
      }
      this.logger.error(`Error computing NCF score for ${owner}/${repo}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return breakdown;
  }
}
