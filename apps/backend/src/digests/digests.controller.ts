import { Controller, Get, UseGuards } from '@nestjs/common';
import { DigestsService } from './digests.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';


@Controller('digests')
@UseGuards(JwtAuthGuard)
export class DigestsController {
  constructor(private readonly digestsService: DigestsService) {}

  @Get('me')
  async getMyDigests(@CurrentUser() user: { sub: string }) {
    return this.digestsService.generateWeeklyDigestForUser(user.sub);
  }
}
