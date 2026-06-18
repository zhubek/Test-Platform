import { IsString, MinLength } from 'class-validator';

export class CreateOptionDto {
  @IsString()
  @MinLength(1)
  valueText!: string;
}
