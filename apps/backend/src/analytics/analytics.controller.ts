import {
  Controller,
  Get,
  Logger,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Commit } from '../github-sync/entities/commit.entity';
import { Repository } from '../github-sync/entities/repository.entity';

@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(
    private analyticsService: AnalyticsService,
    @InjectRepository(Commit)
    private commitRepository: TypeOrmRepository<Commit>,
    @InjectRepository(Repository)
    private repositoryRepository: TypeOrmRepository<Repository>,
  ) {}

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  async getUserAnalytics(@CurrentUser() user: User) {
    try {
      this.logger.debug(`Fetching analytics for user ${user.id}`);

      // Fetch user's commits from database
      const commits = await this.commitRepository.find({
        where: { repository: { user: { id: user.id } } },
        select: ['sha', 'committedAt', 'additions', 'deletions'],
      });

      // Fetch user's repositories with language info
      const repositories = await this.repositoryRepository.find({
        where: { user: { id: user.id } },
        select: ['name', 'language'],
      });

      // Format commits for analysis
      const formattedCommits = commits.map((c) => ({
        sha: c.sha,
        committed_at: c.committedAt.toISOString(),
        additions: c.additions,
        deletions: c.deletions,
      }));

      // Format repositories for analysis
      // Note: bytes field is not available in Repository entity
      // Calculate from commits if needed, or set to 0 for now
      const formattedRepos = repositories.map((r) => ({
        name: r.name,
        language: r.language || 'Unknown',
        bytes: 0, // TODO: Calculate from commit size or fetch from GitHub API
      }));

      // Analyze commits
      const commitAnalytics = await this.analyticsService.analyzeCommits(formattedCommits);

      // Analyze languages
      const languageAnalytics = await this.analyticsService.analyzeLanguages(formattedRepos);

      return {
        user: {
          id: user.id,
          githubUsername: user.githubUsername,
          displayName: user.displayName,
        },
        commits: commitAnalytics,
        languages: languageAnalytics,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error fetching user analytics: ${error.message}`);
      throw new HttpException(
        'Failed to fetch analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/health')
  async analyticsHealth() {
    const isHealthy = await this.analyticsService.healthCheck();
    if (!isHealthy) {
      throw new HttpException(
        'Analytics service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return { status: 'ok', service: 'analytics' };
  }
}
