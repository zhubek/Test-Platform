import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  /** login or (for staff) email */
  @IsString()
  identifier!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
