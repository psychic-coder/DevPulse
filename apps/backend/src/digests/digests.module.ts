import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Digest } from './entities/digest.entity';

import { AiService } from '../shared/ai.service';
import { DigestsController } from './digests.controller';
import { UsersModule } from '../users/users.module';
import { GithubSyncModule } from '../github-sync/github-sync.module';
import { DigestsService } from './digests.service';
import { DigestsCronService } from './digests-cron.service';

@Module({
  imports: [TypeOrmModule.forFeature([Digest]), UsersModule, GithubSyncModule],
  controllers: [DigestsController],
  providers: [DigestsService, DigestsCronService, AiService],
  exports: [DigestsService],
})
export class DigestsModule {}
