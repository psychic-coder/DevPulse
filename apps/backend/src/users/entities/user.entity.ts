import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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
}
