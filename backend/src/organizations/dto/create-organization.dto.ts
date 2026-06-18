import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  /** login for the org's (pending) org_admin account. */
  @IsString()
  @MinLength(1)
  adminLogin!: string;

  @IsOptional()
  @IsString()
  adminName?: string;
}
