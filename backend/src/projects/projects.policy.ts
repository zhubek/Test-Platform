import { ROLES } from '../auth/roles';
import { Policy } from '../common/access/types';
import { ProjectEntity } from './projects.types';

/**
 * Access rules for Project — the control document. Granted if ANY rule matches.
 * `none` = global (any relationship); `org` = the caller is assigned to this
 * project (project_admin). Projects are stateless (no allowedStates).
 */
export const PROJECT_ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'createOrganization',
  'createTest',
  'manageLanguages',
  'manageParams',
] as const;
export type ProjectAction = (typeof PROJECT_ACTIONS)[number];

export const projectPolicy: Policy<ProjectEntity> = [
  // Only the super-admin creates or deletes whole projects.
  { action: 'create', allow: { none: [ROLES.SUPER_ADMIN] } },
  { action: 'delete', allow: { none: [ROLES.SUPER_ADMIN] } },

  // Read/update/manage: super-admin anywhere; project_admin on assigned projects.
  { action: 'read', allow: { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN] } },
  { action: 'update', allow: { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN] } },
  { action: 'createOrganization', allow: { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN] } },
  { action: 'createTest', allow: { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN] } },
  { action: 'manageLanguages', allow: { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN] } },
  { action: 'manageParams', allow: { none: [ROLES.SUPER_ADMIN], org: [ROLES.PROJECT_ADMIN] } },
];
