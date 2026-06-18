import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { BlockType } from '@prisma/client';

export class UpdateBlockDto {
  @IsOptional()
  @IsEnum(BlockType)
  type?: BlockType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsOptional()
  @IsArray()
  props?: unknown[];

  /** Sample values keyed by prop name — used when rendering without chosen props. */
  @IsOptional()
  @IsObject()
  sampleProps?: Record<string, unknown>;
}
