import { ROLES } from '../auth/roles';
import { Policy } from '../common/access/types';
import { BlockEntity } from './blocks.types';

/**
 * Blocks are a GLOBAL library (not project-scoped), so relationship is always
 * `none`. Any authenticated user may read the library; super_admins and
 * project_admins author it (they are the ones building tests/result/dashboard
 * views out of these blocks).
 */
export const BLOCK_ACTIONS = ['create', 'read', 'update', 'delete'] as const;
export type BlockAction = (typeof BLOCK_ACTIONS)[number];

const AUTHORS = [ROLES.SUPER_ADMIN, ROLES.PROJECT_ADMIN];

export const blockPolicy: Policy<BlockEntity> = [
  { action: 'create', allow: { none: AUTHORS } },
  { action: 'read', allow: { none: ['*'] } }, // any authenticated user
  { action: 'update', allow: { none: AUTHORS } },
  { action: 'delete', allow: { none: AUTHORS } },
];
