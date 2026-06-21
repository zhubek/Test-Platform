import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const VAR_KINDS = ['answer', 'variable', 'reference'] as const;
export type VarKind = (typeof VAR_KINDS)[number];

/** One stored variable. `kind` categorizes it (answer/variable/reference);
 *  `refId`/`refType` carry an entity reference (e.g. a top1/2/3 match → a
 *  data-catalog item id) while `value` holds its score. */
export class VariableEntryDto {
  @IsString()
  @MinLength(1)
  variable!: string;

  @IsNumber()
  value!: number;

  @IsOptional()
  @IsIn(VAR_KINDS)
  kind?: VarKind;

  @IsOptional()
  @IsString()
  refType?: string;

  @IsOptional()
  @IsString()
  refId?: string;
}

// Finalize an attempt: store the computed variables (scores, answers, and any
// reference outputs like top1/2/3) and mark the attempt COMPLETED.
export class SubmitAttemptDto {
  /** Legacy flat map of plain numeric variables (kept for back-compat). */
  @IsOptional()
  @IsObject()
  variables?: Record<string, number>;

  /** Rich entries — preferred; supports entity references (refId/refType). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariableEntryDto)
  entries?: VariableEntryDto[];

  @IsOptional()
  @IsObject()
  progress?: Record<string, unknown>;
}
