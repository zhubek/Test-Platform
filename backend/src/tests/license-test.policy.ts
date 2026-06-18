import { LicenseTestState } from '@prisma/client';
import { ROLES } from '../auth/roles';
import { Policy } from '../common/access/types';
import { LicenseTestEntity } from './tests.types';

/**
 * Access rules for a LicenseTest (a holder's attempt). `owner` = the license
 * holder who owns the attempt; `org` = a project_admin on the attempt's
 * project; `none` = super_admin. The holder drives their own attempt
 * (saveProgress/submit) while it is live; admins read and may force-expire.
 */
export const LICENSE_TEST_ACTIONS = ['read', 'saveProgress', 'submit', 'expire'] as const;
export type LicenseTestAction = (typeof LICENSE_TEST_ACTIONS)[number];

export const licenseTestPolicy: Policy<LicenseTestEntity, LicenseTestState> = [
  {
    action: 'read',
    allow: { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN], owner: [ROLES.LICENSE_HOLDER] },
  },
  {
    action: 'saveProgress',
    allowedStates: ['NOT_STARTED', 'IN_PROGRESS'],
    allow: { owner: [ROLES.LICENSE_HOLDER] },
  },
  {
    action: 'submit',
    allowedStates: ['NOT_STARTED', 'IN_PROGRESS'],
    allow: { owner: [ROLES.LICENSE_HOLDER] },
  },
  {
    action: 'expire',
    allowedStates: ['NOT_STARTED', 'IN_PROGRESS'],
    allow: { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN] },
  },
];
