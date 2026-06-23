import { IsOptional, IsString, MinLength } from 'class-validator';

export class SetProjectAdminDto {
  /** The project admin's login (used to sign in to /admin). */
  @IsString()
  @MinLength(1)
  login!: string;

  @IsOptional()
  @IsString()
  name?: string;

  /** Set/reset the password. Required when creating the admin; optional on edit. */
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
