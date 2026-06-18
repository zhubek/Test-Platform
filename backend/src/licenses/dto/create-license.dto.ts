import { IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLicenseDto {
  /** login for the license's (pending) holder account. */
  @IsString()
  @MinLength(1)
  holderLogin!: string;

  @IsOptional()
  @IsString()
  holderName?: string;

  @IsOptional()
  @IsISO8601()
  expirationDate?: string;
}
