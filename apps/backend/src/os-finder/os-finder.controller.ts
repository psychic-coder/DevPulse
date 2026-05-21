import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { OsFinderService } from './os-finder.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { SaveRepoDto } from './dto/save-repo.dto';
import { UpdateSavedRepoDto } from './dto/update-saved-repo.dto';

@Controller('os-finder')
@UseGuards(JwtAuthGuard)
export class OsFinderController {
  private readonly logger = new Logger(OsFinderController.name);

  constructor(private readonly osFinderService: OsFinderService) {}

  @Get('search')
  async search(
    @CurrentUser('sub') userId: string,
    @Query() queryDto: SearchQueryDto,
  ) {
    this.logger.log(`User ${userId} initiated a standard OS Finder search`);
    return this.osFinderService.search(userId, queryDto);
  }

  @Post('search/ai')
  @HttpCode(HttpStatus.OK)
  async searchAi(
    @CurrentUser('sub') userId: string,
    @Body() body: { query: string },
  ) {
    this.logger.log(`User ${userId} initiated an AI-powered OS Finder search with query: "${body.query}"`);
    return this.osFinderService.searchAi(userId, body);
  }

  @Get('repo/:owner/:repo')
  async getRepoDetail(
    @CurrentUser('sub') userId: string,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ) {
    this.logger.log(`User ${userId} requested repo details for ${owner}/${repo}`);
    return this.osFinderService.getRepoDetail(userId, owner, repo);
  }

  @Get('repo/:owner/:repo/issues')
  async getRepoIssues(
    @CurrentUser('sub') userId: string,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ) {
    this.logger.log(`User ${userId} requested open issues for ${owner}/${repo}`);
    return this.osFinderService.getRepoIssues(userId, owner, repo);
  }

  @Post('saved')
  async saveRepo(
    @CurrentUser('sub') userId: string,
    @Body() saveRepoDto: SaveRepoDto,
  ) {
    this.logger.log(`User ${userId} is saving/updating repo ${saveRepoDto.fullName} in watchlist`);
    return this.osFinderService.saveRepo(userId, saveRepoDto);
  }

  @Get('saved')
  async getSavedRepos(@CurrentUser('sub') userId: string) {
    this.logger.log(`User ${userId} requested saved repos watchlist`);
    return this.osFinderService.getSavedRepos(userId);
  }

  @Patch('saved/:id')
  async updateSavedRepo(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() updateSavedRepoDto: UpdateSavedRepoDto,
  ) {
    this.logger.log(`User ${userId} is updating saved repo status/notes for item ${id}`);
    return this.osFinderService.updateSavedRepo(userId, id, updateSavedRepoDto);
  }

  @Delete('saved/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSavedRepo(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    this.logger.log(`User ${userId} is removing repo item ${id} from watchlist`);
    await this.osFinderService.deleteSavedRepo(userId, id);
  }

  @Get('history')
  async getSearchHistory(@CurrentUser('sub') userId: string) {
    this.logger.log(`User ${userId} requested search history`);
    return this.osFinderService.getSearchHistory(userId);
  }
}
