/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable, Logger } from '@nestjs/common';

export interface GithubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface GithubProfile {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export interface GithubRateLimit {
  limit: number;
  remaining: number;
  reset: number;
  resetAt: number;
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly GITHUB_API_BASE = 'https://api.github.com';

  async exchangeCodeForToken(code: string): Promise<GithubTokenResponse> {
    const response = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'DevPulse Backend',
        },
        body: new URLSearchParams({
          client_id: process.env.GITHUB_CLIENT_ID ?? '',
          client_secret: process.env.GITHUB_CLIENT_SECRET ?? '',
          code,
        }).toString(),
      },
    );

    if (!response.ok) {
      throw new Error('Failed to exchange GitHub code for token');
    }

    return (await response.json()) as GithubTokenResponse;
  }

  async getUser(token: string): Promise<GithubProfile> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DevPulse Backend',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GitHub user profile');
    }

    const profile = (await response.json()) as GithubProfile;

    return profile;
  }

  /**
   * Get GitHub API rate limit information
   */
  async getRateLimit(token: string): Promise<GithubRateLimit> {
    const response = await fetch(`${this.GITHUB_API_BASE}/rate_limit`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DevPulse Backend',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GitHub rate limit');
    }

    const data = await response.json();
    const coreLimit = data.resources.core;

    return {
      limit: coreLimit.limit,
      remaining: coreLimit.remaining,
      reset: coreLimit.reset,
      resetAt: coreLimit.reset,
    };
  }

  /**
   * Get all repositories for the authenticated user
   */
  async getUserRepositories(
    token: string,
    page: number = 1,
    perPage: number = 100,
  ): Promise<any[]> {
    const response = await fetch(
      `${this.GITHUB_API_BASE}/user/repos?page=${page}&per_page=${perPage}&sort=updated&direction=desc`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'DevPulse Backend',
        },
      },
    );

    if (!response.ok) {
      this.logger.error(
        `Failed to fetch repositories: ${response.status} ${response.statusText}`,
      );
      throw new Error('Failed to fetch GitHub repositories');
    }

    return (await response.json()) as any[];
  }

  /**
   * Get commits for a specific repository
   */
  async getRepositoryCommits(
    token: string,
    repoFullName: string,
    since: string,
    page: number = 1,
    perPage: number = 100,
  ): Promise<any[]> {
    const response = await fetch(
      `${this.GITHUB_API_BASE}/repos/${repoFullName}/commits?since=${since}&page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'DevPulse Backend',
        },
      },
    );

    if (!response.ok) {
      this.logger.error(
        `Failed to fetch commits for ${repoFullName}: ${response.status}`,
      );
      throw new Error(`Failed to fetch commits for ${repoFullName}`);
    }

    return (await response.json()) as any[];
  }

  /**
   * Get pull requests for a specific repository
   */
  async getRepositoryPullRequests(
    token: string,
    repoFullName: string,
    state: 'open' | 'closed' | 'all' = 'all',
    page: number = 1,
    perPage: number = 100,
  ): Promise<any[]> {
    const response = await fetch(
      `${this.GITHUB_API_BASE}/repos/${repoFullName}/pulls?state=${state}&page=${page}&per_page=${perPage}&sort=updated&direction=desc`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'DevPulse Backend',
        },
      },
    );

    if (!response.ok) {
      this.logger.error(
        `Failed to fetch PRs for ${repoFullName}: ${response.status}`,
      );
      throw new Error(`Failed to fetch PRs for ${repoFullName}`);
    }

    return (await response.json()) as any[];
  }
}
