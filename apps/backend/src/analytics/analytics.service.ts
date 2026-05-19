import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private analyticsUrl: string;
  private allowInlineFallback: boolean;

  constructor(private configService: ConfigService) {
    this.analyticsUrl =
      this.configService.get<string>('ANALYTICS_SERVICE_URL') ||
      'http://localhost:5001';
    this.allowInlineFallback =
      String(
        this.configService.get<string>('ANALYTICS_ALLOW_INLINE_FALLBACK') ||
          'false',
      ).toLowerCase() === 'true';
  }

  /**
   * Analyze commit patterns via Flask analytics service
   */
  async analyzeCommits(commits: any[]): Promise<unknown> {
    try {
      if (!commits || commits.length === 0) {
        const frequencyByHour: Record<number, number> = {};
        for (let i = 0; i < 24; i++) {
          frequencyByHour[i] = 0;
        }
        return {
          peak_hour: 0,
          peak_day: 'Monday',
          avg_daily_commits: 0,
          longest_streak_days: 0,
          current_streak_days: 0,
          total_additions: 0,
          total_deletions: 0,
          commit_frequency_by_hour: frequencyByHour,
          commit_frequency_by_day: {
            Monday: 0,
            Tuesday: 0,
            Wednesday: 0,
            Thursday: 0,
            Friday: 0,
            Saturday: 0,
            Sunday: 0,
          },
        };
      }

      this.logger.debug(`Analyzing ${commits.length} commits`);

      const response = await fetch(`${this.analyticsUrl}/analyse/commits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commits }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Analytics service error: ${error}`);
        throw new HttpException(
          'Failed to analyze commits',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const data = (await response.json()) as unknown;
      return data;
    } catch (error) {
      this.logger.error(
        `Error analyzing commits: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new HttpException(
        'Analytics service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Analyze language distribution via Flask analytics service
   */
  async analyzeLanguages(repositories: any[]): Promise<unknown> {
    try {
      if (!repositories || repositories.length === 0) {
        return {
          distribution: {},
          stats: {},
          top_languages: [],
          diversity: {
            total_languages: 0,
            primary_language: null,
            primary_percentage: 0,
            is_polyglot: false,
          },
        };
      }

      this.logger.debug(`Analyzing ${repositories.length} repositories`);

      const response = await fetch(`${this.analyticsUrl}/analyse/languages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repositories }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Analytics service error: ${error}`);
        throw new HttpException(
          'Failed to analyze languages',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const data = (await response.json()) as unknown;
      return data;
    } catch (error) {
      this.logger.error(
        `Error analyzing languages: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new HttpException(
        'Analytics service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Check if analytics service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.analyticsUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      this.logger.warn(
        `Analytics health check failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /** Should the controller fall back to inline computation when service is down? */
  shouldAllowInlineFallback(): boolean {
    return this.allowInlineFallback;
  }
}
