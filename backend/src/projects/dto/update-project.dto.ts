import { IsInt, IsOptional, IsString, Min, MinLength, ValidateIf } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  licenseLimit?: number;

  /** The project's source/fallback language (a Language id); null clears it. */
  @IsOptional()
  @ValidateIf((o: UpdateProjectDto) => o.defaultLanguageId !== null)
  @IsString()
  defaultLanguageId?: string | null;
}
