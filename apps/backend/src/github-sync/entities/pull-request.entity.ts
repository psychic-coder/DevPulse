import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Repository } from './repository.entity';

@Entity('pull_requests')
@Unique(['userId', 'githubPrId'])
@Index(['userId'])
@Index(['repositoryId'])
@Index(['state'])
@Index(['createdAt'])
export class PullRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.pullRequests, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ type: 'uuid' })
  repositoryId: string;

  @ManyToOne(() => Repository, (repo) => repo.pullRequests, {
    onDelete: 'CASCADE',
  })
  repository: Repository;

  @Column({ type: 'bigint' })
  githubPrId: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ type: 'varchar' })
  state: string; // 'open' | 'closed' | 'merged'

  @Column({ type: 'varchar', nullable: true })
  author: string;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  mergedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'int', default: 0 })
  additions: number;

  @Column({ type: 'int', default: 0 })
  deletions: number;

  @Column({ type: 'int', default: 0 })
  changedFiles: number;

  @Column({ type: 'int', default: 0 })
  commentsCount: number;

  @Column({ type: 'int', default: 0 })
  commitsCount: number;

  @Column({ type: 'float', nullable: true })
  prScore: number;

  @Column({ type: 'timestamp', default: () => 'now()' })
  syncedAt: Date;
}
