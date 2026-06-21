import { IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  /** Latest date this org's licenses may expire (validated ≤ project). */
  @IsOptional()
  @IsISO8601()
  expirationDate?: string;

  /** login for the org's (pending) org_admin account. */
  @IsString()
  @MinLength(1)
  adminLogin!: string;

  @IsOptional()
  @IsString()
  adminName?: string;
}
