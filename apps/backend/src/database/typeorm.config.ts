import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { User } from '../users/entities/user.entity';
import { Repository } from '../github-sync/entities/repository.entity';
import { Commit } from '../github-sync/entities/commit.entity';
import { PullRequest } from '../github-sync/entities/pull-request.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Digest } from '../digests/entities/digest.entity';
import { SavedRepo } from '../os-finder/entities/saved-repo.entity';
import { OsFinderSearch } from '../os-finder/entities/os-finder-search.entity';

export const createTypeOrmOptions = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    User,
    Repository,
    Commit,
    PullRequest,
    Post,
    Comment,
    Digest,
    SavedRepo,
    OsFinderSearch,
  ],
  migrations: [join(__dirname, './migrations/*{.ts,.js}')],
  migrationsRun: true,
  synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
  logging: process.env.DATABASE_LOGGING === 'true',
});

