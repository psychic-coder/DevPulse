import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('saved_repos')
@Unique(['userId', 'githubRepoId'])
@Index(['userId'])
export class SavedRepo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'github_repo_id', type: 'bigint' })
  githubRepoId: number;

  @Column({ type: 'varchar' })
  owner: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ name: 'full_name', type: 'varchar' })
  fullName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  language: string | null;

  @Column({ type: 'int', default: 0 })
  stars: number;

  @Column({ type: 'int', default: 0 })
  forks: number;

  @Column({ name: 'open_issues', type: 'int', default: 0 })
  openIssues: number;

  @Column({ name: 'ncf_score', type: 'double precision', nullable: true })
  ncfScore: number | null;

  @Column({ name: 'lang_match_score', type: 'double precision', nullable: true })
  langMatchScore: number | null;

  @Column({ name: 'last_commit_at', type: 'timestamp', nullable: true })
  lastCommitAt: Date | null;

  @Column({ name: 'has_contributing', type: 'boolean', default: false })
  hasContributing: boolean;

  @Column({ name: 'license_type', type: 'varchar', nullable: true })
  licenseType: string | null;

  @Column({ name: 'html_url', type: 'varchar' })
  htmlUrl: string;

  @CreateDateColumn({ name: 'saved_at' })
  savedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', default: 'saved' })
  status: string; // 'saved' | 'contributed' | 'skipped'
}
