import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { BlockType } from '@prisma/client';

export class CreateBlockDto {
  @IsEnum(BlockType)
  type!: BlockType;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  html?: string;

  /** Declared prop schema: [{ name, type, value }]. */
  @IsOptional()
  @IsArray()
  props?: unknown[];

  /** Sample values keyed by prop name — used when rendering without chosen props. */
  @IsOptional()
  @IsObject()
  sampleProps?: Record<string, unknown>;

  /** The project this block belongs to. */
  @IsOptional()
  @IsString()
  projectId?: string;
}
