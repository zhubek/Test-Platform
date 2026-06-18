import { ProjectRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  /** Reassign the user's project (or its role within it). */
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsEnum(ProjectRole)
  projectRole?: ProjectRole;
}
