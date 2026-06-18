import { IsObject, IsOptional } from 'class-validator';

// name/category are localized objects ({ en, ru, kk }); info/advancedParams are
// free-form bags. All optional — a fresh test starts blank.
export class CreateTestDto {
  @IsOptional()
  @IsObject()
  name?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  category?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  info?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  advancedParams?: Record<string, unknown>;
}
