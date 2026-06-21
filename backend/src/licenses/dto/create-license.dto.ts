import { IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLicenseDto {
  /** login for the license's (pending) holder account. */
  @IsString()
  @MinLength(1)
  holderLogin!: string;

  @IsOptional()
  @IsString()
  holderName?: string;

  /** Required: every license must carry an expiration; validated ≤ org/project. */
  @IsISO8601()
  expirationDate!: string;
}
