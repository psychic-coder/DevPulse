import { IsNotEmpty, IsNumber, IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import type { SavedRepoStatus } from '../../../packages/shared-types/os-finder.types';

export class SaveRepoDto {
  @IsNotEmpty()
  @IsNumber()
  githubRepoId: number;

  @IsNotEmpty()
  @IsString()
  owner: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  language?: string | null;

  @IsOptional()
  @IsNumber()
  stars?: number;

  @IsOptional()
  @IsNumber()
  forks?: number;

  @IsOptional()
  @IsNumber()
  openIssues?: number;

  @IsOptional()
  ncfScore?: any;

  @IsOptional()
  @IsNumber()
  langMatchScore?: number | null;

  @IsOptional()
  @IsString()
  lastCommitAt?: string | null;

  @IsOptional()
  @IsBoolean()
  hasContributing?: boolean;

  @IsOptional()
  @IsString()
  licenseType?: string | null;

  @IsNotEmpty()
  @IsString()
  htmlUrl: string;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsEnum(['saved', 'contributed', 'skipped'])
  status?: SavedRepoStatus = 'saved';
}
