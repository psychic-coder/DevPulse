import { Controller, Get, UseGuards } from '@nestjs/common';
import { DigestsService } from './digests.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Post, Param } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

@Controller('digests')
@UseGuards(JwtAuthGuard)
export class DigestsController {
  constructor(private readonly digestsService: DigestsService) {}

  @Get('me')
  async getMyDigests(@CurrentUser() user: { sub: string }) {
    return this.digestsService.generateWeeklyDigestForUser(user.sub);
  }

  // Temporary admin endpoint to trigger digest generation for a given user id
  @Public()
  @Post('admin/generate/:userId')
  async generateForUser(@Param('userId') userId: string) {
    try {
      const result = await this.digestsService.generateWeeklyDigestForUser(userId);
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: e?.message ?? String(e) };
    }
  }
}
