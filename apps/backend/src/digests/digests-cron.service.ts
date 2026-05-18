import { Injectable, Logger } from '@nestjs/common';
import cron from 'node-cron';
import { DigestsService } from './digests.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class DigestsCronService {
  private readonly logger = new Logger(DigestsCronService.name);

  constructor(private readonly digestsService: DigestsService, private readonly usersService: UsersService) {
    // Schedule every Monday at 8AM
    cron.schedule('0 8 * * 1', async () => {
      this.logger.log('Running weekly digest cron');
      try {
        const users = await this.usersService.findAll();
        for (const u of users) {
          try {
            await this.digestsService.generateWeeklyDigestForUser(u.id);
          } catch (e) {
            this.logger.error(`Failed to generate digest for user ${u.id}: ${e.message}`);
          }
        }
      } catch (e) {
        this.logger.error('Failed to run weekly digest cron: ' + e.message);
      }
    });
  }
}
