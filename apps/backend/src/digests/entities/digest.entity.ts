import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('digests')
export class Digest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (u) => u.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'week_start', type: 'date' })
  weekStart: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'raw_stats', type: 'jsonb', nullable: true })
  rawStats: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
