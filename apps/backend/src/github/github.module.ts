import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { CacheModule } from '../common/cache/cache.module';

@Module({
  imports: [CacheModule],
  providers: [GithubService],
  exports: [GithubService],
})
export class GithubModule {}
