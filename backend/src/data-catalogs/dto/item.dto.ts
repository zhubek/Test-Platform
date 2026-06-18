import { IsObject, IsOptional } from 'class-validator';

export class CreateItemDto {
  /** Localized { en, ru, kk }. */
  @IsObject()
  title!: Record<string, unknown>;

  /** Localized { en, ru, kk }. */
  @IsOptional()
  @IsObject()
  description?: Record<string, unknown>;

  /** Structured data & relations (e.g. education program ids, access). */
  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;

  /** Extra-variable values keyed by varName; value = Localized json. */
  @IsOptional()
  @IsObject()
  values?: Record<string, unknown>;
}

export class UpdateItemDto {
  @IsOptional()
  @IsObject()
  title?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  description?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;

  /** Upserted per key; a null value deletes that variable's value. */
  @IsOptional()
  @IsObject()
  values?: Record<string, unknown>;

  /**
   * Per-item prop OVERRIDES on the group's template blocks, keyed by
   * DcgPageBlock id. Value = props object; null removes the override.
   */
  @IsOptional()
  @IsObject()
  pageProps?: Record<string, unknown>;

  /** Numeric characteristic values keyed by characteristic id; null deletes. */
  @IsOptional()
  @IsObject()
  characteristicValues?: Record<string, number | null>;
}
