import { IsOptional, IsString, IsEnum } from 'class-validator';
import type { SavedRepoStatus } from '../../../../../packages/shared-types/os-finder.types';

export class UpdateSavedRepoDto {
  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsEnum(['saved', 'contributed', 'skipped'])
  status?: SavedRepoStatus;
}
