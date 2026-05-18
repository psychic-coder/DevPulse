import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { GithubSyncService } from './github-sync.service';
import { GithubSyncCronService } from './github-sync-cron.service';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class GithubSyncController {
  constructor(
    private readonly githubSyncService: GithubSyncService,
    private readonly githubSyncCronService: GithubSyncCronService,
  ) {}

  /**
   * Manual trigger to sync GitHub data for the authenticated user
   */
  @Post('github')
  async syncGithubData(@CurrentUser() user: { sub: string }) {
    const result = await this.githubSyncService.syncUserData(user.sub);
    return {
      success: true,
      message: 'GitHub data synced successfully',
      data: result,
    };
  }

  /**
   * Get streak stats computed from persisted commits for the authenticated user
   */
  @Get('github/streaks')
  async getGithubStreaks(@CurrentUser() user: { sub: string }) {
    const data = await this.githubSyncService.getUserStreaks(user.sub);
    return {
      success: true,
      data,
    };
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
