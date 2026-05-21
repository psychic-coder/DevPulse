import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../common/cache/cache.module';
import { User } from '../users/entities/user.entity';
import { Commit } from '../github-sync/entities/commit.entity';
import { PullRequest } from '../github-sync/entities/pull-request.entity';
import { AiService } from '../shared/ai.service';
import { SavedRepo } from './entities/saved-repo.entity';
import { OsFinderSearch } from './entities/os-finder-search.entity';
import { OsFinderController } from './os-finder.controller';
import { OsFinderService } from './os-finder.service';
import { OsFinderCacheService } from './os-finder-cache.service';
import { RepoHealthService } from './repo-health.service';
import { NcfScorerService } from './ncf-scorer.service';
import { AiQueryBuilderService } from './ai-query-builder.service';

@Module({
  imports: [
    CacheModule,
    TypeOrmModule.forFeature([
      User,
      SavedRepo,
      OsFinderSearch,
      Commit,
      PullRequest,
    ]),
  ],
  controllers: [OsFinderController],
  providers: [
    OsFinderService,
    OsFinderCacheService,
    RepoHealthService,
    NcfScorerService,
    AiQueryBuilderService,
    AiService,
  ],
  exports: [OsFinderService],
})
export class OsFinderModule {}
