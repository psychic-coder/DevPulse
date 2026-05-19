import { Controller, Post, Get, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { GithubSyncService } from './github-sync.service';
import { GithubSyncCronService } from './github-sync-cron.service';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class GithubSyncController {
  private readonly logger = new Logger(GithubSyncController.name);

  constructor(
    private readonly githubSyncService: GithubSyncService,
    private readonly githubSyncCronService: GithubSyncCronService,
  ) {}

  /**
   * Manual trigger to sync GitHub data for the authenticated user.
   * Responds immediately with 202 and runs sync in the background
   * to avoid proxy timeouts on long-running GitHub API calls.
   */
  @Post('github')
  syncGithubData(@CurrentUser() user: { sub: string }) {
    // Fire-and-forget: start sync without awaiting to prevent ECONNRESET
    this.githubSyncService.syncUserData(user.sub).catch((err) => {
      this.logger.error(
        `Background sync failed for user ${user.sub}: ${err instanceof Error ? err.message : String(err)}`,
      );
    });

    return {
      success: true,
      message:
        'GitHub sync started in background. Listen to realtime events for progress.',
    };
  }

  /**
   * Get streak stats computed from persisted commits for the authenticated user
   */
  @Get('github/streaks')
  async getGithubStreaks(@CurrentUser() user: { sub: string }) {
    // Return directly (no wrapper) so frontend can destructure currentStreak etc. immediately
    return this.githubSyncService.getUserStreaks(user.sub);
  }

  /**
   * Get synced GitHub data for the authenticated user
   */
  @Get('github')
  async getGithubData(@CurrentUser() user: { sub: string }) {
    const data = await this.githubSyncService.getUserData(user.sub);
    return {
      success: true,
      data,
    };
  }

  /**
   * Admin endpoint: Manually trigger sync for all users
   */
  @Post('github/admin/sync-all')
  @Public()
  async syncAllUsers() {
    const result = await this.githubSyncCronService.triggerSyncAllUsers();
    return {
      success: true,
      message: 'Triggered sync for all users',
      data: result,
    };
  }
}
