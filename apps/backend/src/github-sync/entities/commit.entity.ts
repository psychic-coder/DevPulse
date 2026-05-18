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
import { Repository } from './repository.entity';

@Entity('commits')
@Unique(['userId', 'sha'])
@Index(['userId'])
@Index(['repositoryId'])
@Index(['committedAt'])
export class Commit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', insert: false, update: false })
  userId: string;

  @ManyToOne(() => User, (user) => user.commits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'repository_id', type: 'uuid', insert: false, update: false })
  repositoryId: string;

  @ManyToOne(() => Repository, (repo) => repo.commits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'repository_id' })
  repository: Repository;

  @Column({ type: 'varchar' })
  sha: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'author_name', type: 'varchar', nullable: true })
  authorName: string;

  @Column({ name: 'author_email', type: 'varchar', nullable: true })
  authorEmail: string;

  @Column({ name: 'committed_at', type: 'timestamp' })
  committedAt: Date;

  @Column({ type: 'int', default: 0 })
  additions: number;

  @Column({ type: 'int', default: 0 })
  deletions: number;

  @Column({ name: 'files_changed', type: 'int', default: 0 })
  filesChanged: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
