import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private readonly logger = new Logger(JwtRefreshStrategy.name);

  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Try to extract from request body first (sent by frontend)
        (request: Request) => {
          const body = request.body as Record<string, unknown> | undefined;
          const token = body?.refreshToken as string | undefined;
          if (token) {
            this.logger.debug('Refresh token extracted from request body');
            return token;
          }
          // Try to extract from cookies (for backward compatibility)
          const cookies = request.cookies as
            | Record<string, unknown>
            | undefined;
          const cookieToken = cookies?.refresh_token as string | undefined;
          if (cookieToken) {
            this.logger.debug('Refresh token extracted from cookies');
            return cookieToken;
          }
          // Fallback to Authorization header
          const authHeader = request.get('authorization');
          if (authHeader?.startsWith('Bearer ')) {
            this.logger.debug(
              'Refresh token extracted from Authorization header',
            );
            return authHeader.slice(7);
          }
          this.logger.warn('No refresh token found in request');
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') ?? '',
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async validate(payload: { sub: string; githubUsername: string }) {
    this.logger.debug(`Validating refresh token for user: ${payload.sub}`);
    return payload;
  }
}
