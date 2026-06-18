import { IsString, MinLength } from 'class-validator';

/** Redeem an Organization/License activation code and set the account password. */
export class ActivateDto {
  @IsString()
  code!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
