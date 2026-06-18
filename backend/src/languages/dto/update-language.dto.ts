import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateLanguageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  label?: string;
}
