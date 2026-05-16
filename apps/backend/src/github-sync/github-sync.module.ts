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

@Module({
  imports: [
    TypeOrmModule.forFeature([Repository, Commit, PullRequest, User]),
    GithubModule,
    UsersModule,
  ],
  controllers: [GithubSyncController],
  providers: [GithubSyncService, GithubSyncCronService],
  exports: [GithubSyncService],
})
export class GithubSyncModule {}
