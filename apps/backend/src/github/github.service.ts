import { Injectable } from '@nestjs/common';

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

@Injectable()
export class GithubService {
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
}
