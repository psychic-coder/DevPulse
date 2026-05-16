/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-misused-promises */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import * as cron from 'node-cron';
import { GithubSyncService } from './github-sync.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class GithubSyncCronService implements OnModuleInit {
  private readonly logger = new Logger(GithubSyncCronService.name);
  private cronJob: cron.ScheduledTask | null = null;

  constructor(
    @InjectRepository(User)
    private userRepository: TypeOrmRepository<User>,
    private githubSyncService: GithubSyncService,
  ) {}

  /**
   * Initialize cron jobs on module load
   */
  onModuleInit() {
    this.startCronJobs();
  }

  /**
   * Start cron jobs
   */
  private startCronJobs() {
    // Run every 6 hours: 0 0 */6 * * * (at 12:00 AM, 6:00 AM, 12:00 PM, 6:00 PM)
    this.cronJob = cron.schedule('0 0 */6 * * *', async () => {
      this.logger.log('Starting 6-hourly GitHub data sync for all users...');
      await this.syncAllUsers();
    });

    this.logger.log('GitHub sync cron job scheduled (every 6 hours)');
  }

  /**
   * Stop cron jobs
   */
  stopCronJobs() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.logger.log('GitHub sync cron job stopped');
    }
  }

  /**
   * Sync GitHub data for all users
   */
  private async syncAllUsers() {
    try {
      const users = await this.userRepository.find();

      if (!users || users.length === 0) {
        this.logger.log('No users found to sync');
        return;
      }

      this.logger.log(`Syncing GitHub data for ${users.length} users...`);

      for (const user of users) {
        try {
          const result = await this.githubSyncService.syncUserData(user.id);
          this.logger.log(
            `Synced user ${user.githubUsername}: ${result.repositories} repos, ${result.commits} commits, ${result.pullRequests} PRs`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to sync user ${user.githubUsername}: ${error.message}`,
          );
          // Continue with next user even if one fails
        }
      }

      this.logger.log('Completed 6-hourly GitHub data sync for all users');
    } catch (error) {
      this.logger.error(
        `Error during sync all users: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Manual trigger to sync all users (for testing or immediate sync)
   */
  async triggerSyncAllUsers(): Promise<{ usersProcessed: number }> {
    const users = await this.userRepository.find();
    let successCount = 0;

    for (const user of users) {
      try {
        await this.githubSyncService.syncUserData(user.id);
        successCount++;
      } catch (error) {
        this.logger.error(
          `Failed to sync user ${user.githubUsername}: ${error.message}`,
        );
      }
    }

    return { usersProcessed: successCount };
  }
}
