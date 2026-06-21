import { IsInt, IsISO8601, IsOptional, IsString, Min, MinLength, ValidateIf } from 'class-validator';

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  licenseCount?: number;

  /** Latest date this org's licenses may expire; null clears it. Validated ≤ project. */
  @IsOptional()
  @ValidateIf((o: UpdateOrganizationDto) => o.expirationDate !== null)
  @IsISO8601()
  expirationDate?: string | null;
}
