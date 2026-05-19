import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

export interface UpsertUserInput {
  githubId: string;
  githubUsername: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  githubToken: string;
  refreshToken?: string | null;
  locale?: string;
}

export interface UserWithStats {
  id: string;
  githubId: string;
  githubUsername: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date | null;
  repositories: number;
  commits: number;
  pullRequests: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async upsertUser(input: UpsertUserInput): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { githubId: input.githubId },
    });

    if (existingUser) {
      Object.assign(existingUser, {
        githubUsername: input.githubUsername,
        displayName: input.displayName ?? existingUser.displayName,
        avatarUrl: input.avatarUrl ?? existingUser.avatarUrl,
        email: input.email ?? existingUser.email,
        githubToken: input.githubToken,
        refreshToken: input.refreshToken ?? existingUser.refreshToken,
        locale: input.locale ?? existingUser.locale,
      });

      return this.userRepository.save(existingUser);
    }

    const user = this.userRepository.create({
      githubId: input.githubId,
      githubUsername: input.githubUsername,
      displayName: input.displayName ?? null,
      avatarUrl: input.avatarUrl ?? null,
      email: input.email ?? null,
      githubToken: input.githubToken,
      refreshToken: input.refreshToken ?? null,
      locale: input.locale ?? 'en',
    });

    return this.userRepository.save(user);
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByIdWithStats(id: string): Promise<UserWithStats | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['repositories', 'commits', 'pullRequests'],
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      githubId: user.githubId,
      githubUsername: user.githubUsername,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      email: user.email,
      locale: user.locale,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastSyncedAt: user.lastSyncedAt ?? null,
      repositories: user.repositories?.length ?? 0,
      commits: user.commits?.length ?? 0,
      pullRequests: user.pullRequests?.length ?? 0,
    };
  }

  findByGithubId(githubId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { githubId } });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<User | null> {
    const user = await this.findById(userId);

    if (!user) {
      return null;
    }

    user.refreshToken = refreshToken;

    return this.userRepository.save(user);
  }

  async updateLastSynced(userId: string, when: Date): Promise<User | null> {
    const user = await this.findById(userId);
    if (!user) return null;
    user.lastSyncedAt = when;
    return this.userRepository.save(user);
  }
}
