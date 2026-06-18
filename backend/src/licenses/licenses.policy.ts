import { LicenseState } from '@prisma/client';
import { ROLES } from '../auth/roles';
import { Policy } from '../common/access/types';
import { LicenseEntity } from './licenses.types';

/**
 * Access rules for License. Relationship: `owner` = the holder of this license;
 * `org` = an org_admin of the license's org or a project_admin of its project.
 * Transition actions use `allowedStates` so the policy and the transition map
 * agree on which moves are even offered.
 */
export const LICENSE_ACTIONS = [
  'read',
  'update',
  'delete',
  'resetCode', // regenerate the license code (restore the holder)
  'revoke',
  'expire',
  'renew',
] as const;
export type LicenseAction = (typeof LICENSE_ACTIONS)[number];

const MANAGERS = [ROLES.PROJECT_ADMIN, ROLES.ORG_ADMIN];
const ISSUED_OR_ACTIVE: LicenseState[] = ['ISSUED', 'ACTIVE'];

export const licensePolicy: Policy<LicenseEntity, LicenseState> = [
  // Holder may read their own; managers read within scope; super reads all.
  {
    action: 'read',
    allow: { none: [ROLES.SUPER_ADMIN], org: MANAGERS, owner: [ROLES.LICENSE_HOLDER] },
  },
  { action: 'update', allow: { none: [ROLES.SUPER_ADMIN], org: MANAGERS } },
  { action: 'delete', allow: { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN] } },
  { action: 'resetCode', allow: { none: [ROLES.SUPER_ADMIN], org: MANAGERS } },

  // Lifecycle moves — gated by current state so UI hints match the transition map.
  { action: 'revoke', allowedStates: ISSUED_OR_ACTIVE, allow: { none: [ROLES.SUPER_ADMIN], org: MANAGERS } },
  { action: 'expire', allowedStates: ISSUED_OR_ACTIVE, allow: { none: [ROLES.SUPER_ADMIN], org: MANAGERS } },
  { action: 'renew', allowedStates: ['EXPIRED'], allow: { none: [ROLES.SUPER_ADMIN], org: MANAGERS } },
];
