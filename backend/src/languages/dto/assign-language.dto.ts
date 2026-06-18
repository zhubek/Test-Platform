import { IsString, MinLength } from 'class-validator';

export class AssignLanguageDto {
  @IsString()
  @MinLength(1)
  languageId!: string;
}
