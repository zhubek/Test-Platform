import { IsObject, IsOptional } from 'class-validator';

export class UpdateTestDto {
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
