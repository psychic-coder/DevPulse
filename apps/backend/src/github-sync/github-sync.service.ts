/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository, LessThan } from 'typeorm';
import { Repository } from './entities/repository.entity';
import { Commit } from './entities/commit.entity';
import { PullRequest } from './entities/pull-request.entity';
import { GithubService } from '../github/github.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { decryptToken } from '../common/utils/crypto.util';

@Injectable()
export class GithubSyncService {
  private readonly logger = new Logger(GithubSyncService.name);
  private readonly COMMITS_LOOKBACK_DAYS = 90;
  private readonly GITHUB_API_RATE_LIMIT_THRESHOLD = 100;

  constructor(
    @InjectRepository(Repository)
    private repositoryRepo: TypeOrmRepository<Repository>,
    @InjectRepository(Commit)
    private commitRepo: TypeOrmRepository<Commit>,
    @InjectRepository(PullRequest)
    private pullRequestRepo: TypeOrmRepository<PullRequest>,
    private githubService: GithubService,
    private usersService: UsersService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  /**
   * Synchronize all GitHub data for a user
   */
  async syncUserData(userId: string): Promise<{
    repositories: number;
    commits: number;
    pullRequests: number;
  }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Emit sync started event
    this.realtimeGateway.emitSyncStarted(userId, new Date());

    const githubToken = decryptToken(user.githubToken);
    const rateLimitInfo = await this.githubService.getRateLimit(githubToken);

    if (rateLimitInfo.remaining < this.GITHUB_API_RATE_LIMIT_THRESHOLD) {
      throw new BadRequestException(
        `GitHub API rate limit too low. Remaining: ${rateLimitInfo.remaining}. Reset at: ${new Date(rateLimitInfo.resetAt * 1000).toISOString()}`,
      );
    }

    try {
      const reposCount = await this.syncRepositories(user, githubToken);
      const commitsCount = await this.syncCommits(user, githubToken);
      const prsCount = await this.syncPullRequests(user, githubToken);

      this.logger.log(
        `Synced user ${userId}: ${reposCount} repos, ${commitsCount} commits, ${prsCount} PRs`,
      );

      // Emit sync complete event
      this.realtimeGateway.emitSyncComplete(userId, {
        totalCommits: commitsCount,
        totalPRs: prsCount,
        syncedAt: new Date(),
        newCommits: commitsCount,
        newPRs: prsCount,
      });

      return {
        repositories: reposCount,
        commits: commitsCount,
        pullRequests: prsCount,
      };
    } catch (error) {
      this.logger.error(`Error syncing data for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Sync repositories for a user
   */
  private async syncRepositories(
    user: User,
    githubToken: string,
  ): Promise<number> {
    let page = 1;
    let totalCount = 0;
    const perPage = 100;

    while (true) {
      const repos = await this.githubService.getUserRepositories(
        githubToken,
        page,
        perPage,
      );

      if (!repos || repos.length === 0) break;

      for (const repo of repos) {
        const existingRepo = await this.repositoryRepo.findOne({
          where: {
            userId: user.id,
            githubRepoId: repo.id,
          },
        });

        if (existingRepo) {
          // Update existing repository
          existingRepo.stars = repo.stargazers_count || 0;
          existingRepo.forks = repo.forks_count || 0;
          existingRepo.language = repo.language || null;
          existingRepo.description = repo.description || null;
          existingRepo.updatedAt = repo.updated_at
            ? new Date(repo.updated_at)
            : new Date();
          existingRepo.syncedAt = new Date();
          await this.repositoryRepo.save(existingRepo);
        } else {
          // Create new repository
          const newRepo = this.repositoryRepo.create({
            userId: user.id,
            githubRepoId: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            language: repo.language || null,
            stars: repo.stargazers_count || 0,
            forks: repo.forks_count || 0,
            isPrivate: repo.private || false,
            description: repo.description || null,
            url: repo.html_url,
            updatedAt: repo.updated_at ? new Date(repo.updated_at) : new Date(),
            syncedAt: new Date(),
          });
          await this.repositoryRepo.save(newRepo);
        }

        totalCount++;
      }

      if (repos.length < perPage) break;
      page++;
    }

    return totalCount;
  }

  /**
   * Sync commits for a user (last 90 days)
   */
  private async syncCommits(user: User, githubToken: string): Promise<number> {
    const repositories = await this.repositoryRepo.find({
      where: { userId: user.id },
    });

    let totalCount = 0;
    const since = new Date();
    since.setDate(since.getDate() - this.COMMITS_LOOKBACK_DAYS);

    for (const repo of repositories) {
      try {
        let page = 1;
        const perPage = 100;

        while (true) {
          const commits = await this.githubService.getRepositoryCommits(
            githubToken,
            repo.fullName,
            since.toISOString(),
            page,
            perPage,
            user.githubUsername,
          );

          if (!commits || commits.length === 0) break;

          for (const commit of commits) {
            const existingCommit = await this.commitRepo.findOne({
              where: {
                userId: user.id,
                sha: commit.sha,
              },
            });

            if (!existingCommit) {
              const newCommit = this.commitRepo.create({
                userId: user.id,
                repositoryId: repo.id,
                sha: commit.sha,
                message: commit.commit?.message || '',
                authorName: commit.commit?.author?.name || null,
                authorEmail: commit.commit?.author?.email || null,
                committedAt: commit.commit?.author?.date
                  ? new Date(commit.commit.author.date)
                  : new Date(),
                additions: commit.stats?.additions || 0,
                deletions: commit.stats?.deletions || 0,
                filesChanged: commit.files?.length || 0,
              });
              await this.commitRepo.save(newCommit);
              totalCount++;

              // Emit new commit event in real-time
              if (this.realtimeGateway.hasActiveConnections(user.id)) {
                this.realtimeGateway.emitNewCommit(user.id, {
                  sha: newCommit.sha,
                  message: newCommit.message,
                  repo: repo.name,
                  committed_at: newCommit.committedAt.toISOString(),
                  additions: newCommit.additions,
                  deletions: newCommit.deletions,
                });
              }
            }
          }

          if (commits.length < perPage) break;
          page++;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to sync commits for repo ${repo.fullName}: ${error.message}`,
        );
      }
    }

    return totalCount;
  }

  /**
   * Sync pull requests for a user
   */
  private async syncPullRequests(
    user: User,
    githubToken: string,
  ): Promise<number> {
    const repositories = await this.repositoryRepo.find({
      where: { userId: user.id },
    });

    let totalCount = 0;

    for (const repo of repositories) {
      try {
        let page = 1;
        const perPage = 100;

        // Fetch open PRs
        while (true) {
          const prs = await this.githubService.getRepositoryPullRequests(
            githubToken,
            repo.fullName,
            'open',
            page,
            perPage,
          );

          if (!prs || prs.length === 0) break;

          for (const pr of prs) {
            if (pr.user?.login !== user.githubUsername) continue;
            await this.savePullRequest(user.id, repo.id, pr);
            totalCount++;
          }

          if (prs.length < perPage) break;
          page++;
        }

        // Fetch recently closed/merged PRs (last 30 days)
        page = 1;
        while (true) {
          const prs = await this.githubService.getRepositoryPullRequests(
            githubToken,
            repo.fullName,
            'closed',
            page,
            perPage,
          );

          if (!prs || prs.length === 0) break;

          let hasRecentPr = false;
          for (const pr of prs) {
            if (pr.user?.login !== user.githubUsername) continue;
            const updatedAt = new Date(pr.updated_at);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            if (updatedAt > thirtyDaysAgo) {
              await this.savePullRequest(user.id, repo.id, pr);
              totalCount++;
              hasRecentPr = true;
            }
          }

          if (!hasRecentPr || prs.length < perPage) break;
          page++;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to sync PRs for repo ${repo.fullName}: ${error.message}`,
        );
      }
    }

    return totalCount;
  }

  /**
   * Helper to save or update a pull request
   */
  private async savePullRequest(
    userId: string,
    repositoryId: string,
    pr: any,
  ): Promise<void> {
    const existingPr = await this.pullRequestRepo.findOne({
      where: {
        userId,
        githubPrId: pr.id,
      },
    });

    if (existingPr) {
      existingPr.state = pr.state;
      existingPr.mergedAt = pr.merged_at ? new Date(pr.merged_at) : null;
      existingPr.closedAt = pr.closed_at ? new Date(pr.closed_at) : null;
      existingPr.additions = pr.additions || 0;
      existingPr.deletions = pr.deletions || 0;
      existingPr.changedFiles = pr.changed_files || 0;
      existingPr.commentsCount = pr.comments || 0;
      existingPr.commitsCount = pr.commits || 0;
      existingPr.syncedAt = new Date();
      await this.pullRequestRepo.save(existingPr);
    } else {
      const newPr = this.pullRequestRepo.create({
        userId,
        repositoryId,
        githubPrId: pr.id,
        title: pr.title,
        body: pr.body || null,
        state: pr.state,
        author: pr.user?.login || null,
        createdAt: new Date(pr.created_at),
        mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
        closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
        additions: pr.additions || 0,
        deletions: pr.deletions || 0,
        changedFiles: pr.changed_files || 0,
        commentsCount: pr.comments || 0,
        commitsCount: pr.commits || 0,
        syncedAt: new Date(),
      });
      await this.pullRequestRepo.save(newPr);

      // Emit new PR event in real-time
      if (this.realtimeGateway.hasActiveConnections(userId)) {
        const repo = await this.repositoryRepo.findOne({
          where: { id: repositoryId },
        });
        this.realtimeGateway.emitNewPR(userId, {
          id: newPr.githubPrId.toString(),
          title: newPr.title,
          state: newPr.state as 'open' | 'closed' | 'merged',
          repo: repo?.name || 'unknown',
          created_at: newPr.createdAt.toISOString(),
          url: pr.html_url,
        });
      }
    }
  }

  /**
   * Get synced data for a user
   */
  async getUserData(userId: string) {
    const [repositories, commits, pullRequests] = await Promise.all([
      this.repositoryRepo.find({ where: { userId } }),
      this.commitRepo.find({ where: { userId } }),
      this.pullRequestRepo.find({ where: { userId } }),
    ]);

    return {
      repositories,
      commits,
      pullRequests,
      summary: {
        totalRepositories: repositories.length,
        totalCommits: commits.length,
        totalPullRequests: pullRequests.length,
        lastSyncedAt: new Date(),
      },
    };
  }

  /**
   * Clear old data (optional cleanup)
   */
  async clearOldData(userId: string, daysOld: number = 180): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.commitRepo.delete({
      userId,
      createdAt: LessThan(cutoffDate),
    });

    this.logger.log(
      `Deleted ${result.affected} old commits for user ${userId}`,
    );
    return result.affected || 0;
  }
}
