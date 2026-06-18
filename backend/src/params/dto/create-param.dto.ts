import { ParamType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateParamDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsEnum(ParamType)
  type?: ParamType;
}
