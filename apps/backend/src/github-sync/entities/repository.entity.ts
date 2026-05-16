import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  Unique,
  Index,
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

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.repositories, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ type: 'bigint' })
  githubRepoId: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  fullName: string;

  @Column({ type: 'varchar', nullable: true })
  language: string;

  @Column({ type: 'int', default: 0 })
  stars: number;

  @Column({ type: 'int', default: 0 })
  forks: number;

  @Column({ type: 'boolean', default: false })
  isPrivate: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  url: string;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;

  @Column({ type: 'timestamp', default: () => 'now()' })
  syncedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Commit, (commit) => commit.repository)
  commits: Commit[];

  @OneToMany(() => PullRequest, (pr) => pr.repository)
  pullRequests: PullRequest[];
}
