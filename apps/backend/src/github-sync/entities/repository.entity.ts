import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  Unique,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Commit } from './commit.entity';
import { PullRequest } from './pull-request.entity';

@Entity('repositories')
@Unique(['userId', 'githubRepoId'])
@Index(['userId'])
export class Repository {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.repositories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'github_repo_id', type: 'bigint' })
  githubRepoId: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ name: 'full_name', type: 'varchar' })
  fullName: string;

  @Column({ type: 'varchar', nullable: true })
  language: string;

  @Column({ type: 'int', default: 0 })
  stars: number;

  @Column({ type: 'int', default: 0 })
  forks: number;

  @Column({ name: 'is_private', type: 'boolean', default: false })
  isPrivate: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  url: string;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;

  @Column({ name: 'synced_at', type: 'timestamp', default: () => 'now()' })
  syncedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Commit, (commit) => commit.repository)
  commits: Commit[];

  @OneToMany(() => PullRequest, (pr) => pr.repository)
  pullRequests: PullRequest[];
}
