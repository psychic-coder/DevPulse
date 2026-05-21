import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../common/cache/cache.service';
import * as crypto from 'crypto';

@Injectable()
export class OsFinderCacheService {
  private readonly logger = new Logger(OsFinderCacheService.name);

  constructor(private readonly cacheService: CacheService) {}

  private md5(val: string): string {
    return crypto.createHash('md5').update(val).digest('hex');
  }

  // 1. Search Results Cache
  async getSearchResults(userId: string, filters: any): Promise<any | null> {
    const sortedFilters = this.sortObjectKeys(filters);
    const filterHash = this.md5(JSON.stringify(sortedFilters));
    const key = `os_finder:${userId}:${filterHash}`;
    return this.cacheService.get<any>(key);
  }

  async setSearchResults(userId: string, filters: any, results: any): Promise<void> {
    const sortedFilters = this.sortObjectKeys(filters);
    const filterHash = this.md5(JSON.stringify(sortedFilters));
    const key = `os_finder:${userId}:${filterHash}`;
    await this.cacheService.set(key, results, 1800); // 30 minutes TTL
  }

  // 2. Repo Health Flags Cache
  async getRepoHealth(owner: string, repo: string): Promise<any | null> {
    const key = `gh_repo_health:${owner.toLowerCase()}/${repo.toLowerCase()}`;
    return this.cacheService.get<any>(key);
  }

  async setRepoHealth(owner: string, repo: string, health: any): Promise<void> {
    const key = `gh_repo_health:${owner.toLowerCase()}/${repo.toLowerCase()}`;
    await this.cacheService.set(key, health, 14400); // 4 hours TTL
  }

  // 3. Issues List Cache
  async getRepoIssues(owner: string, repo: string, labels: string[]): Promise<any[] | null> {
    const labelHash = this.md5(labels.sort().join(','));
    const key = `gh_repo_issues:${owner.toLowerCase()}/${repo.toLowerCase()}:${labelHash}`;
    return this.cacheService.get<any[]>(key);
  }

  async setRepoIssues(owner: string, repo: string, labels: string[], issues: any[]): Promise<void> {
    const labelHash = this.md5(labels.sort().join(','));
    const key = `gh_repo_issues:${owner.toLowerCase()}/${repo.toLowerCase()}:${labelHash}`;
    await this.cacheService.set(key, issues, 3600); // 1 hour TTL
  }

  // 4. PR Stats Cache
  async getPRStats(owner: string, repo: string): Promise<any | null> {
    const key = `gh_repo_prstats:${owner.toLowerCase()}/${repo.toLowerCase()}`;
    return this.cacheService.get<any>(key);
  }

  async setPRStats(owner: string, repo: string, stats: any): Promise<void> {
    const key = `gh_repo_prstats:${owner.toLowerCase()}/${repo.toLowerCase()}`;
    await this.cacheService.set(key, stats, 21600); // 6 hours TTL
  }

  // 5. Watchlist / Saved Repos Cache
  async getSavedRepos(userId: string): Promise<any[] | null> {
    const key = `os_finder_saved:${userId}`;
    return this.cacheService.get<any[]>(key);
  }

  async setSavedRepos(userId: string, saved: any[]): Promise<void> {
    const key = `os_finder_saved:${userId}`;
    await this.cacheService.set(key, saved, 300); // 5 minutes TTL
  }

  async invalidateSavedRepos(userId: string): Promise<void> {
    const key = `os_finder_saved:${userId}`;
    await this.cacheService.delete(key);
  }

  // Utility to recursively sort object keys to ensure consistent hashes
  private sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }
    const sortedKeys = Object.keys(obj).sort();
    const result: any = {};
    sortedKeys.forEach(key => {
      result[key] = this.sortObjectKeys(obj[key]);
    });
    return result;
  }
}
