import { Controller, Get, Post, Query, Res, UseGuards, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtRefreshAuthGuard } from '../common/guards/jwt-refresh.guard';
import { JwtAuthGuard } from '../common/guards/jwt.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('github')
  githubLogin(@Res() res: Response) {
    return res.redirect(this.authService.getGithubAuthorizationUrl());
  }

  @Public()
  @Get('github/callback')
  async githubCallback(@Query('code') code: string, @Res() res: Response) {
    const result = await this.authService.handleGithubCallback(code);
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: process.env.NODE_ENV === 'production',
    });

    return res.redirect(
      `${process.env.APP_URL ?? 'http://localhost:3001'}/auth/callback?token=${result.accessToken}`,
    );
  }

  @Public()
  @Get('callback')
  authCallback(@Query('token') token: string) {
    return {
      message: 'GitHub login complete',
      accessToken: token,
    };
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  async refresh(
    @CurrentUser() payload: { sub: string; githubUsername: string },
    @Res() res: Response,
  ) {
    // Log for debugging whether refresh cookie was present on the request
    this.logger.log('Handling refresh request');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // @ts-ignore
    const incomingCookie = (res as any).req?.cookies?.refresh_token;
    if (incomingCookie) {
      this.logger.log('Incoming refresh_token cookie present');
    } else {
      this.logger.warn('No refresh_token cookie on incoming refresh request');
    }

    const result = await this.authService.refreshAccessToken(payload);

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return res.json({ accessToken: result.accessToken });
  }

  @UseGuards(JwtAuthGuard)
  @Get('session')
  session() {
    return { status: 'authenticated' };
  }
}
