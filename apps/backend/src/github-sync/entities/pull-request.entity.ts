import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  Index,
  JoinColumn,
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

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.pullRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'repository_id', type: 'uuid' })
  repositoryId: string;

  @ManyToOne(() => Repository, (repo) => repo.pullRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'repository_id' })
  repository: Repository;

  @Column({ name: 'github_pr_id', type: 'bigint' })
  githubPrId: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ type: 'varchar' })
  state: string; // 'open' | 'closed' | 'merged'

  @Column({ type: 'varchar', nullable: true })
  author: string;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'merged_at', type: 'timestamp', nullable: true })
  mergedAt: Date | null;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'int', default: 0 })
  additions: number;

  @Column({ type: 'int', default: 0 })
  deletions: number;

  @Column({ name: 'changed_files', type: 'int', default: 0 })
  changedFiles: number;

  @Column({ name: 'comments_count', type: 'int', default: 0 })
  commentsCount: number;

  @Column({ name: 'commits_count', type: 'int', default: 0 })
  commitsCount: number;

  @Column({ name: 'pr_score', type: 'float', nullable: true })
  prScore: number;

  @Column({ name: 'synced_at', type: 'timestamp', default: () => 'now()' })
  syncedAt: Date;
}
