import { IsString, MinLength } from 'class-validator';

export class RedeemDto {
  @IsString()
  @MinLength(1)
  code!: string;
}

export class SelectLicenseDto {
  @IsString()
  @MinLength(1)
  licenseId!: string;
}
