import { TestState } from '@prisma/client';
import { ROLES } from '../auth/roles';
import { Policy } from '../common/access/types';
import { TestEntity } from './tests.types';

/**
 * Access rules for Test — project-scoped authoring. `none` = global
 * (super_admin); `org` = a project_admin assigned to the test's project. The
 * lifecycle actions (publish/unpublish/archive) carry `allowedStates`, so the
 * policy refuses them outright from an impossible state before transitions even
 * run. Reading a PUBLISHED test is open to its license holders so they can take
 * it.
 */
export const TEST_ACTIONS = [
  'read',
  'update',
  'delete',
  'manageBlocks',
  'manageParams',
  'publish',
  'unpublish',
  'archive',
  'attempt',
] as const;
export type TestAction = (typeof TEST_ACTIONS)[number];

const ADMINS = { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN] };

export const testPolicy: Policy<TestEntity, TestState> = [
  // Admins read any test in scope; license holders may read a PUBLISHED one.
  {
    action: 'read',
    allow: { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN] },
  },
  {
    action: 'read',
    allowedStates: ['PUBLISHED'],
    allow: { org: [ROLES.LICENSE_HOLDER] },
  },
  { action: 'update', allow: ADMINS },
  { action: 'delete', allow: ADMINS },
  { action: 'manageBlocks', allow: ADMINS },
  { action: 'manageParams', allow: ADMINS },

  { action: 'publish', allowedStates: ['DRAFT', 'ARCHIVED'], allow: ADMINS },
  { action: 'unpublish', allowedStates: ['PUBLISHED'], allow: ADMINS },
  { action: 'archive', allowedStates: ['DRAFT', 'PUBLISHED'], allow: ADMINS },

  // Starting/continuing an attempt — the license holder, on a published test.
  { action: 'attempt', allowedStates: ['PUBLISHED'], allow: { org: [ROLES.LICENSE_HOLDER] } },
];
