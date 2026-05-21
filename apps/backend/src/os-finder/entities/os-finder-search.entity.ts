import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('os_finder_searches')
@Index(['userId', 'createdAt'])
export class OsFinderSearch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'query_text', type: 'text', nullable: true })
  queryText: string | null;

  @Column({ name: 'filters_applied', type: 'jsonb' })
  filtersApplied: any;

  @Column({ name: 'result_count', type: 'int', nullable: true })
  resultCount: number | null;

  @Column({ name: 'ai_query_used', type: 'boolean', default: false })
  aiQueryUsed: boolean;

  @Column({ name: 'github_query', type: 'text', nullable: true })
  githubQuery: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
