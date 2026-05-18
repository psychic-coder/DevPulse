import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { DigestsService } from './digests.service';
import type { Request } from 'express';

@Controller('digests')
export class DigestsController {
  constructor(private readonly digestsService: DigestsService) {}

  @Get('me')
  async getMyDigests(@Req() req: Request) {
    const user = (req as any).user;
    if (!user || !user.id) throw new UnauthorizedException();

    // return last 5 digests for the user
    // repository access via service not yet implemented; fallback to generate on demand
    // For now, return generation result for latest week
    const digest = await this.digestsService.generateWeeklyDigestForUser(user.id);
    return digest;
  }
}
