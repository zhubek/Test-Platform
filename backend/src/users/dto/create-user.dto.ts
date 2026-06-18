import { ProjectRole } from '@prisma/client';
import { IsEmail, IsEnum, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ROLES } from '../../auth/roles';

/** Creates a STAFF account (super_admin / project_admin) — created ACTIVE with a password. */
export class CreateUserDto {
  @IsString()
  @MinLength(1)
  login!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;

  /** Global role (UserRole). */
  @IsIn([ROLES.SUPER_ADMIN, ROLES.PROJECT_ADMIN])
  role!: string;

  /** The project this user belongs to (omit for a global super_admin). */
  @IsOptional()
  @IsString()
  projectId?: string;

  /** The user's role within that project. */
  @IsOptional()
  @IsEnum(ProjectRole)
  projectRole?: ProjectRole;
}
