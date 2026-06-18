import { IsIn } from 'class-validator';
import { ALL_ROLES } from '../../auth/roles';

export class AssignRoleDto {
  @IsIn(ALL_ROLES)
  roleName!: string;
}
