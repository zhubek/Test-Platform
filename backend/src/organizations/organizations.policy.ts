import { ROLES } from '../auth/roles';
import { Policy } from '../common/access/types';
import { OrganizationEntity } from './organizations.types';

/**
 * Access rules for Organization. `org` here means the caller is scoped to this
 * org — either its org_admin (user.orgId === org.id) or a project_admin of the
 * org's project (see organizations.access.ts). Stateless entity.
 */
export const ORGANIZATION_ACTIONS = [
  'read',
  'update',
  'delete',
  'resetCode', // regenerate the org's activation code (restores its org_admin)
  'createLicense', // issue a license under this org (provisions a license_holder)
] as const;
export type OrganizationAction = (typeof ORGANIZATION_ACTIONS)[number];

export const organizationPolicy: Policy<OrganizationEntity> = [
  { action: 'read', allow: { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN, ROLES.ORG_ADMIN] } },
  { action: 'update', allow: { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN] } },
  { action: 'delete', allow: { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN] } },
  // Only the tier ABOVE the org_admin (project_admin / super) may reset its code.
  { action: 'resetCode', allow: { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN] } },
  // org_admin issues licenses in their org; project_admin may too.
  { action: 'createLicense', allow: { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN, ROLES.ORG_ADMIN] } },
];
