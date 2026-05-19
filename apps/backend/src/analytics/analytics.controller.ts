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
    this.logger.debug(`Fetching analytics for user ${user.id}`);

    // Fetch user's commits from database
    const commits = await this.commitRepository.find({
      where: { user: { id: user.id } },
      select: ['sha', 'committedAt', 'additions', 'deletions'],
    });

    // Fetch user's repositories with language info
    const repositories = await this.repositoryRepository.find({
      where: { user: { id: user.id } },
      select: ['name', 'language'],
    });

    const formattedCommits = commits.map((c) => ({
      sha: c.sha,
      committed_at: c.committedAt?.toISOString() ?? new Date().toISOString(),
      additions: c.additions,
      deletions: c.deletions,
    }));

    const formattedRepos = repositories.map((r) => ({
      name: r.name,
      language: r.language || 'Unknown',
      bytes: 0,
    }));

    // Try to use the analytics microservice; fall back to inline computation
    let commitAnalytics: unknown;
    let languageAnalytics: unknown;

    try {
      const healthy = await this.analyticsService.healthCheck();
      if (healthy) {
        const results = await Promise.all([
          this.analyticsService.analyzeCommits(formattedCommits),
          this.analyticsService.analyzeLanguages(formattedRepos),
        ]);
        commitAnalytics = results[0];
        languageAnalytics = results[1];
      } else {
        throw new Error('unhealthy');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.warn('Analytics microservice unavailable: ' + errorMessage);

      // If the analytics service is configured to allow inline fallback use it,
      // otherwise return 503 so the caller knows the dedicated service is down.
      if (this.analyticsService.shouldAllowInlineFallback()) {
        this.logger.warn('Falling back to inline analytics computation');
        commitAnalytics = this.computeInlineCommitAnalytics(commits);
        languageAnalytics = this.computeInlineLanguageAnalytics(repositories);
      } else {
        throw new HttpException(
          'Analytics microservice is unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }

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
  }

  /** Compute commit frequency analytics directly from DB records */
  private computeInlineCommitAnalytics(commits: Commit[]) {
    const byHour: Record<number, number> = {};
    const byDay: Record<string, number> = {};
    const DAYS = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    let totalAdditions = 0;
    let totalDeletions = 0;

    for (let i = 0; i < 24; i++) byHour[i] = 0;
    for (const d of DAYS) byDay[d] = 0;

    for (const c of commits) {
      const dt = c.committedAt ? new Date(c.committedAt) : null;
      if (!dt || isNaN(dt.getTime())) continue;
      byHour[dt.getUTCHours()] = (byHour[dt.getUTCHours()] ?? 0) + 1;
      byDay[DAYS[dt.getUTCDay()]] = (byDay[DAYS[dt.getUTCDay()]] ?? 0) + 1;
      totalAdditions += c.additions ?? 0;
      totalDeletions += c.deletions ?? 0;
    }

    const peakHourEntry = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];
    const peakDayEntry = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];

    return {
      peak_hour: peakHourEntry ? Number(peakHourEntry[0]) : 0,
      peak_day: peakDayEntry ? peakDayEntry[0] : 'Monday',
      avg_daily_commits:
        commits.length > 0 ? Math.round((commits.length / 90) * 10) / 10 : 0,
      longest_streak_days: 0,
      current_streak_days: 0,
      total_additions: totalAdditions,
      total_deletions: totalDeletions,
      commit_frequency_by_hour: byHour,
      commit_frequency_by_day: byDay,
    };
  }

  /** Compute language distribution directly from DB records */
  private computeInlineLanguageAnalytics(repositories: Repository[]) {
    const dist: Record<string, number> = {};
    for (const r of repositories) {
      const lang = r.language || 'Unknown';
      dist[lang] = (dist[lang] ?? 0) + 1;
    }
    const total = repositories.length || 1;
    const topLanguages = Object.entries(dist)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        percentage: Math.round((count / total) * 100),
      }));
    const primary = topLanguages[0]?.name ?? null;
    return {
      distribution: dist,
      stats: Object.fromEntries(
        Object.entries(dist).map(([k, v]) => [
          k,
          { percentage: Math.round((v / total) * 100) },
        ]),
      ),
      top_languages: topLanguages,
      diversity: {
        total_languages: Object.keys(dist).length,
        primary_language: primary,
        primary_percentage: topLanguages[0]?.percentage ?? 0,
        is_polyglot: Object.keys(dist).length > 2,
      },
    };
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
