import { Controller, Get, Post, Query, Req, Res, UseGuards, Logger } from '@nestjs/common';
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

    // Redirect to frontend callback page with both tokens as URL params
    // The frontend will store them and send the refresh token back when needed
    return res.redirect(
      `${process.env.APP_URL ?? 'http://localhost:3001'}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
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
    @Req() req: any,
    @CurrentUser() payload: { sub: string; githubUsername: string },
    @Res() res: Response,
  ) {
    this.logger.debug(`Refresh endpoint reached for user: ${payload.sub}`);
    this.logger.debug(`Refresh token in body: ${req.body?.refreshToken ? 'yes' : 'no'}`);

    const result = await this.authService.refreshAccessToken(payload);

    return res.json({ accessToken: result.accessToken });
  }

  @UseGuards(JwtAuthGuard)
  @Get('session')
  session() {
    return { status: 'authenticated' };
  }
}
