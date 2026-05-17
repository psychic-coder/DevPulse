import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: Redis;
  private isConnected = false;

  // Cache TTLs (in seconds)
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly RATE_LIMIT_TTL = 60; // 1 minute
  private readonly REPOS_TTL = 3600; // 1 hour
  private readonly COMMITS_TTL = 1800; // 30 minutes
  private readonly PRS_TTL = 1800; // 30 minutes
  private readonly SYNC_SUMMARY_TTL = 300; // 5 minutes

  constructor(private configService: ConfigService) {}

  /**
   * Initialize Redis connection on module load
   */
  async onModuleInit() {
    try {
      const redisUrl = this.configService.get<string>('redis.url');
      const redisDb = this.configService.get<number>('redis.db', 0);

      if (!redisUrl) {
        this.logger.warn('Redis URL not configured. Cache disabled.');
        return;
      }

      this.redisClient = new Redis(redisUrl, {
        db: redisDb,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.redisClient.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis connected');
      });

      this.redisClient.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
        this.isConnected = false;
      });

      // Test connection
      await this.redisClient.ping();
      this.isConnected = true;
      this.logger.log('Redis cache service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
      this.isConnected = false;
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.redisClient && this.isConnected) {
      await this.redisClient.quit();
      this.logger.log('Redis disconnected');
    }
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected && !!this.redisClient;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isReady()) return null;

    try {
      const value = await this.redisClient.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.warn(`Failed to get cache key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = this.DEFAULT_TTL,
  ): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      await this.redisClient.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      this.logger.warn(`Failed to set cache key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete a cache key
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      await this.redisClient.del(key);
      return true;
    } catch (error) {
      this.logger.warn(`Failed to delete cache key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete multiple cache keys by pattern
   */
  async deleteByPattern(pattern: string): Promise<number> {
    if (!this.isReady()) return 0;

    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length === 0) return 0;
      const deleted = await this.redisClient.del(...keys);
      return deleted;
    } catch (error) {
      this.logger.warn(`Failed to delete pattern ${pattern}:`, error.message);
      return 0;
    }
  }

  /**
   * Cache GitHub rate limit
   */
  async setRateLimit(
    token: string,
    rateLimit: {
      limit: number;
      remaining: number;
      reset: number;
      resetAt: number;
    },
  ): Promise<void> {
    const key = `gh:rateLimit:${this.hashToken(token)}`;
    await this.set(key, rateLimit, this.RATE_LIMIT_TTL);
  }

  /**
   * Get cached GitHub rate limit
   */
  async getRateLimit(
    token: string,
  ): Promise<{
    limit: number;
    remaining: number;
    reset: number;
    resetAt: number;
  } | null> {
    const key = `gh:rateLimit:${this.hashToken(token)}`;
    return this.get(key);
  }

  /**
   * Cache repositories list
   */
  async setRepositories(
    userId: string,
    repos: any[],
  ): Promise<void> {
    const key = `gh:repos:${userId}`;
    await this.set(key, repos, this.REPOS_TTL);
  }

  /**
   * Get cached repositories
   */
  async getRepositories(userId: string): Promise<any[] | null> {
    const key = `gh:repos:${userId}`;
    return this.get(key);
  }

  /**
   * Cache commits
   */
  async setCommits(
    userId: string,
    repoName: string,
    commits: any[],
  ): Promise<void> {
    const key = `gh:commits:${userId}:${repoName}`;
    await this.set(key, commits, this.COMMITS_TTL);
  }

  /**
   * Get cached commits
   */
  async getCommits(userId: string, repoName: string): Promise<any[] | null> {
    const key = `gh:commits:${userId}:${repoName}`;
    return this.get(key);
  }

  /**
   * Cache pull requests
   */
  async setPullRequests(
    userId: string,
    repoName: string,
    prs: any[],
  ): Promise<void> {
    const key = `gh:prs:${userId}:${repoName}`;
    await this.set(key, prs, this.PRS_TTL);
  }

  /**
   * Get cached pull requests
   */
  async getPullRequests(userId: string, repoName: string): Promise<any[] | null> {
    const key = `gh:prs:${userId}:${repoName}`;
    return this.get(key);
  }

  /**
   * Cache sync summary
   */
  async setSyncSummary(
    userId: string,
    summary: {
      totalRepositories: number;
      totalCommits: number;
      totalPullRequests: number;
      lastSyncedAt: Date;
    },
  ): Promise<void> {
    const key = `gh:syncSummary:${userId}`;
    await this.set(key, summary, this.SYNC_SUMMARY_TTL);
  }

  /**
   * Get cached sync summary
   */
  async getSyncSummary(userId: string): Promise<{
    totalRepositories: number;
    totalCommits: number;
    totalPullRequests: number;
    lastSyncedAt: Date;
  } | null> {
    const key = `gh:syncSummary:${userId}`;
    return this.get(key);
  }

  /**
   * Clear all GitHub cache for a user
   */
  async clearUserGithubCache(userId: string): Promise<void> {
    await this.deleteByPattern(`gh:*:${userId}*`);
    this.logger.log(`Cleared GitHub cache for user ${userId}`);
  }

  /**
   * Clear all GitHub cache (admin)
   */
  async clearAllGithubCache(): Promise<void> {
    const deleted = await this.deleteByPattern('gh:*');
    this.logger.log(`Cleared all GitHub cache (${deleted} keys)`);
  }

  /**
   * Hash token for safer cache key
   */
  private hashToken(token: string): string {
    return token.substring(token.length - 12);
  }
}
