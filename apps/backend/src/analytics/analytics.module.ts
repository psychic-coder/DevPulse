import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Commit } from '../github-sync/entities/commit.entity';
import { Repository } from '../github-sync/entities/repository.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Commit, Repository]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
