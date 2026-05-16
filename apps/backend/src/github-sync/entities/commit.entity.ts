import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
  Index,
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

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.commits, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'uuid' })
  repositoryId: string;

  @ManyToOne(() => Repository, (repo) => repo.commits, {
    onDelete: 'CASCADE',
  })
  repository: Repository;

  @Column({ type: 'varchar' })
  sha: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', nullable: true })
  authorName: string;

  @Column({ type: 'varchar', nullable: true })
  authorEmail: string;

  @Column({ type: 'timestamp' })
  committedAt: Date;

  @Column({ type: 'int', default: 0 })
  additions: number;

  @Column({ type: 'int', default: 0 })
  deletions: number;

  @Column({ type: 'int', default: 0 })
  filesChanged: number;

  @CreateDateColumn()
  createdAt: Date;
}
