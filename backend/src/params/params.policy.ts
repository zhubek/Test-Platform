import { ROLES } from '../auth/roles';
import { Policy } from '../common/access/types';
import { ParamEntity } from './params.types';

/**
 * Access rules for ProjectParam. `org` = scoped to the param's project. Creation
 * is a Project action (`manageParams`); here we govern the param itself + its
 * options. org_admin may READ params (to tag licenses) but not edit them.
 */
export const PARAM_ACTIONS = ['read', 'update', 'delete', 'manageOptions'] as const;
export type ParamAction = (typeof PARAM_ACTIONS)[number];

export const paramPolicy: Policy<ParamEntity> = [
  { action: 'read', allow: { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN, ROLES.ORG_ADMIN] } },
  { action: 'update', allow: { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN] } },
  { action: 'delete', allow: { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN] } },
  { action: 'manageOptions', allow: { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN] } },
];
