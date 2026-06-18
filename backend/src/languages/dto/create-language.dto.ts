import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLanguageDto {
  /** BCP-47 code, e.g. "tr". */
  @IsString()
  @MinLength(1)
  name!: string;

  /** Human display name, e.g. "Türkçe". */
  @IsOptional()
  @IsString()
  label?: string;
}
