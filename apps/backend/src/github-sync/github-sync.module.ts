import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GithubSyncService } from './github-sync.service';
import { GithubSyncController } from './github-sync.controller';
import { GithubSyncCronService } from './github-sync-cron.service';
import { Repository } from './entities/repository.entity';
import { Commit } from './entities/commit.entity';
import { PullRequest } from './entities/pull-request.entity';
import { User } from '../users/entities/user.entity';
import { GithubModule } from '../github/github.module';
import { UsersModule } from '../users/users.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PrScoreService } from './pr-score.service';
import { AiService } from '../shared/ai.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Repository, Commit, PullRequest, User]),
    GithubModule,
    UsersModule,
    RealtimeModule,
  ],
  controllers: [GithubSyncController],
  providers: [
    GithubSyncService,
    GithubSyncCronService,
    PrScoreService,
    AiService,
  ],
  exports: [GithubSyncService],
})
export class GithubSyncModule {}
