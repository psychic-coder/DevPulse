import { Injectable, Logger } from '@nestjs/common';
import cron from 'node-cron';
import { DigestsService } from './digests.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class DigestsCronService {
  private readonly logger = new Logger(DigestsCronService.name);

  constructor(
    private readonly digestsService: DigestsService,
    private readonly usersService: UsersService,
  ) {
    cron.schedule('0 8 * * 1', () => {
      this.runWeeklyDigest().catch((e) => {
        this.logger.error('Failed to run weekly digest cron: ' + e);
      });
    });
  }

  private async runWeeklyDigest(): Promise<void> {
    this.logger.log('Running weekly digest cron');
    try {
      const users = await this.usersService.findAll();
      for (const u of users) {
        try {
          await this.digestsService.generateWeeklyDigestForUser(u.id);
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          this.logger.error(
            `Failed to generate digest for user ${u.id}: ${errorMessage}`,
          );
        }
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      this.logger.error('Failed to run weekly digest cron: ' + errorMessage);
    }
  }
}
