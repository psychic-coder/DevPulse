import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Repository } from '../../github-sync/entities/repository.entity';
import { Commit } from '../../github-sync/entities/commit.entity';
import { PullRequest } from '../../github-sync/entities/pull-request.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'github_id', type: 'varchar', unique: true })
  githubId!: string;

  @Column({ name: 'github_username', type: 'varchar' })
  githubUsername!: string;

  @Column({ name: 'display_name', type: 'varchar', nullable: true })
  displayName!: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'varchar', nullable: true })
  email!: string | null;

  @Column({ name: 'github_token', type: 'text' })
  githubToken!: string;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken!: string | null;

  @Column({ type: 'varchar', default: 'en' })
  locale!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Repository, (repo) => repo.user)
  repositories: Repository[];

  @OneToMany(() => Commit, (commit) => commit.user)
  commits: Commit[];

  @OneToMany(() => PullRequest, (pr) => pr.user)
  pullRequests: PullRequest[];
}
