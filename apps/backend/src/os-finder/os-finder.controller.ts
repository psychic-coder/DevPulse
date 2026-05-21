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
    @CurrentUser() user: User,
    @Query() queryDto: SearchQueryDto,
  ) {
    this.logger.log(`User ${user.id} initiated a standard OS Finder search`);
    return this.osFinderService.search(user.id, queryDto);
  }

  @Post('search/ai')
  @HttpCode(HttpStatus.OK)
  async searchAi(
    @CurrentUser() user: User,
    @Body() body: { query: string },
  ) {
    this.logger.log(`User ${user.id} initiated an AI-powered OS Finder search with query: "${body.query}"`);
    return this.osFinderService.searchAi(user.id, body);
  }

  @Get('repo/:owner/:repo')
  async getRepoDetail(
    @CurrentUser() user: User,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ) {
    this.logger.log(`User ${user.id} requested repo details for ${owner}/${repo}`);
    return this.osFinderService.getRepoDetail(user.id, owner, repo);
  }

  @Get('repo/:owner/:repo/issues')
  async getRepoIssues(
    @CurrentUser() user: User,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ) {
    this.logger.log(`User ${user.id} requested open issues for ${owner}/${repo}`);
    return this.osFinderService.getRepoIssues(user.id, owner, repo);
  }

  @Post('saved')
  async saveRepo(
    @CurrentUser() user: User,
    @Body() saveRepoDto: SaveRepoDto,
  ) {
    this.logger.log(`User ${user.id} is saving/updating repo ${saveRepoDto.fullName} in watchlist`);
    return this.osFinderService.saveRepo(user.id, saveRepoDto);
  }

  @Get('saved')
  async getSavedRepos(@CurrentUser() user: User) {
    this.logger.log(`User ${user.id} requested saved repos watchlist`);
    return this.osFinderService.getSavedRepos(user.id);
  }

  @Patch('saved/:id')
  async updateSavedRepo(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateSavedRepoDto: UpdateSavedRepoDto,
  ) {
    this.logger.log(`User ${user.id} is updating saved repo status/notes for item ${id}`);
    return this.osFinderService.updateSavedRepo(user.id, id, updateSavedRepoDto);
  }

  @Delete('saved/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSavedRepo(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    this.logger.log(`User ${user.id} is removing repo item ${id} from watchlist`);
    await this.osFinderService.deleteSavedRepo(user.id, id);
  }

  @Get('history')
  async getSearchHistory(@CurrentUser() user: User) {
    this.logger.log(`User ${user.id} requested search history`);
    return this.osFinderService.getSearchHistory(user.id);
  }
}
