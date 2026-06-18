import { IsOptional, IsString, MinLength } from 'class-validator';

export class SetOrgAdminDto {
  @IsString()
  @MinLength(1)
  login!: string;

  @IsOptional()
  @IsString()
  name?: string;
}
