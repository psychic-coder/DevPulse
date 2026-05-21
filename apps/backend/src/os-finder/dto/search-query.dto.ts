import { IsOptional, IsString, IsEnum, IsNumber, IsBoolean, IsArray, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import type { Difficulty, ContributionType, Domain, RepoSize, LanguageMode } from '../../../../../packages/shared-types/os-finder.types';

export class SearchQueryDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean);
    return value;
  })
  languages?: string[];

  @IsOptional()
  @IsEnum(['strict', 'any_of'])
  languageMode?: LanguageMode = 'any_of';

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty?: Difficulty;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean);
    return value;
  })
  contributionTypes?: ContributionType[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean);
    return value;
  })
  domains?: Domain[];

  @IsOptional()
  @IsEnum(['small', 'medium', 'large', 'any'])
  repoSize?: RepoSize = 'any';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => value !== undefined ? parseInt(value, 10) : undefined)
  lastCommitDays?: number = 90;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => value !== undefined ? parseInt(value, 10) : undefined)
  minOpenIssues?: number = 3;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => value !== undefined ? parseInt(value, 10) : undefined)
  issueFreshDays?: number = 60;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  hasContributing?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  hasCodeOfConduct?: boolean = false;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean);
    return value;
  })
  licenseTypes?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => value !== undefined ? parseFloat(value) : undefined)
  prMergeRate?: number = 30;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  includeAlreadyContributed?: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => value !== undefined ? parseInt(value, 10) : undefined)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => value !== undefined ? parseInt(value, 10) : undefined)
  limit?: number = 30;
}
