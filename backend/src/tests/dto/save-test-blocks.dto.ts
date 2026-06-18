import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { TestSurface } from '@prisma/client';

// One block instance in the saved list. `order` is optional — the service
// renumbers by array position so the client can just send them in order.
export class TestBlockInput {
  @IsString()
  blockId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsObject()
  props?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  advancedParams?: Record<string, unknown>;
}

// Replace ALL blocks of one surface with this ordered list (mirrors how the
// editor holds the whole surface as a single draft).
export class SaveTestBlocksDto {
  @IsEnum(TestSurface)
  surface!: TestSurface;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestBlockInput)
  blocks!: TestBlockInput[];
}
