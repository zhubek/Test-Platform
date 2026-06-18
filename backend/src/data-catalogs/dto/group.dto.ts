import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export const VARIABLE_TYPES = ['text', 'number', 'boolean', 'date'] as const;

/** One extra-variable slot of the group. */
export class VariableDto {
  @IsString()
  @MinLength(1)
  varName!: string;

  @IsOptional()
  @IsBoolean()
  hasOptions?: boolean;

  /** Value kind. */
  @IsOptional()
  @IsIn(VARIABLE_TYPES)
  type?: (typeof VARIABLE_TYPES)[number];

  /** When the group is public, expose this variable as a filter. */
  @IsOptional()
  @IsBoolean()
  filterable?: boolean;

  /** Allowed values for select-type variables (Localized json each). */
  @IsOptional()
  @IsArray()
  options?: unknown[];
}

/** One block instance inside a page template. `id` keeps an existing instance
 *  on update (so items' per-block prop overrides survive page edits). */
export class PageBlockDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(1)
  blockId!: string;

  /** Template prop values: design literals or { $bind } data bindings. */
  @IsOptional()
  @IsObject()
  props?: Record<string, unknown>;
}

/** One page template. `id` keeps an existing page on update (sync by id). */
export class PageDto {
  @IsOptional()
  @IsString()
  id?: string;

  /** Localized { en, ru, kk }. */
  @IsObject()
  pageName!: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageBlockDto)
  blocks?: PageBlockDto[];
}

export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsObject()
  info?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  /** The project this catalog group belongs to. */
  @IsOptional()
  @IsString()
  projectId?: string;

  /** Slots defined up front, in display order. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariableDto)
  variables?: VariableDto[];
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsObject()
  info?: Record<string, unknown>;

  /** Whether the group is exposed on the public site. */
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  /** When public, the page template (a page id) rendered as the card view; null clears it. */
  @IsOptional()
  @ValidateIf((o: UpdateGroupDto) => o.cardPageId !== null)
  @IsString()
  cardPageId?: string | null;

  /** Full replacement set, synced by varName (existing values survive renames-by-keep). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariableDto)
  variables?: VariableDto[];

  /** Full replacement set, synced by page id. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageDto)
  pages?: PageDto[];

  /** Attached characteristic group ids — full replacement set. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  characteristicGroupIds?: string[];
}
