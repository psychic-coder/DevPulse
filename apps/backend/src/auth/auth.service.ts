import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { GithubService } from '../github/github.service';
import { encryptToken } from '../common/utils/crypto.util';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly githubService: GithubService,
    private readonly usersService: UsersService,
  ) {}

  getGithubAuthorizationUrl(): string {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID') ?? '';
    const callbackUrl =
      this.configService.get<string>('GITHUB_CALLBACK_URL') ?? '';

    return `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=read:user%20user:email`;
  }

  async handleGithubCallback(
    code: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!code) {
      throw new UnauthorizedException('GitHub authorization code is required');
    }

    const tokenResponse = await this.githubService.exchangeCodeForToken(code);
    const profile = await this.githubService.getUser(
      tokenResponse.access_token,
    );
    const refreshToken = await this.issueRefreshToken(
      profile.id.toString(),
      profile.login,
    );

    const user = await this.usersService.upsertUser({
      githubId: profile.id.toString(),
      githubUsername: profile.login,
      displayName: profile.name,
      avatarUrl: profile.avatar_url,
      email: profile.email,
      githubToken: encryptToken(tokenResponse.access_token),
      refreshToken,
    });

    return {
      accessToken: await this.issueAccessToken(user.id, user.githubUsername),
      refreshToken,
    };
  }

  async refreshAccessToken(payload: {
    sub: string;
    githubUsername: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    if (!payload.sub || !payload.githubUsername) {
      throw new UnauthorizedException('Refresh token payload is invalid');
    }

    const refreshToken = await this.issueRefreshToken(
      payload.sub,
      payload.githubUsername,
    );

    const updatedUser = await this.usersService.updateRefreshToken(
      payload.sub,
      refreshToken,
    );

    if (!updatedUser) {
      throw new UnauthorizedException('User not found');
    }

    return {
      accessToken: await this.issueAccessToken(
        payload.sub,
        payload.githubUsername,
      ),
      refreshToken,
    };
  }

  private async issueAccessToken(
    userId: string,
    githubUsername: string,
  ): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, githubUsername },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRY') as never,
      },
    );
  }

  private async issueRefreshToken(
    userId: string,
    githubUsername: string,
  ): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, githubUsername },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRY',
        ) as never,
      },
    );
  }
}
