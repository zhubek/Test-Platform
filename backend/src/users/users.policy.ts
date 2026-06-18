import { ROLES } from '../auth/roles';
import { Policy } from '../common/access/types';
import { UserEntity } from './users.types';

/**
 * Access rules for User. `owner` = the caller is this same user (self-service).
 * Account administration is super_admin-only; org_admin/license_holder accounts
 * are provisioned/reset through the organizations/licenses modules, not here.
 */
export const USER_ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'assignRole',
  'assignProject',
  'disable',
] as const;
export type UserAction = (typeof USER_ACTIONS)[number];

export const userPolicy: Policy<UserEntity> = [
  { action: 'create', allow: { none: [ROLES.SUPER_ADMIN] } },
  // Anyone may read/update their own record; super_admin reads/updates anyone.
  { action: 'read', allow: { none: [ROLES.SUPER_ADMIN], owner: ['*'] } },
  { action: 'update', allow: { none: [ROLES.SUPER_ADMIN], owner: ['*'] } },
  { action: 'delete', allow: { none: [ROLES.SUPER_ADMIN] } },
  { action: 'assignRole', allow: { none: [ROLES.SUPER_ADMIN] } },
  { action: 'assignProject', allow: { none: [ROLES.SUPER_ADMIN] } },
  { action: 'disable', allow: { none: [ROLES.SUPER_ADMIN] } },
];
