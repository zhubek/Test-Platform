import { ROLES } from '../auth/roles';
import { Policy } from '../common/access/types';
import {
  CatalogGroupEntity,
  CatalogItemEntity,
  CharacteristicEntity,
  CharacteristicGroupEntity,
} from './data-catalogs.types';

/**
 * Data catalogs are GLOBAL content (like blocks): any authenticated user may
 * read them; super_admins and project_admins author groups (schema: extra
 * variables, page templates) and items (data).
 */
export const CATALOG_ACTIONS = ['create', 'read', 'update', 'delete'] as const;
export type CatalogAction = (typeof CATALOG_ACTIONS)[number];

const AUTHORS = [ROLES.SUPER_ADMIN, ROLES.PROJECT_ADMIN];

export const catalogGroupPolicy: Policy<CatalogGroupEntity> = [
  { action: 'create', allow: { none: AUTHORS } },
  { action: 'read', allow: { none: ['*'] } }, // any authenticated user
  { action: 'update', allow: { none: AUTHORS } },
  { action: 'delete', allow: { none: AUTHORS } },
];

export const catalogItemPolicy: Policy<CatalogItemEntity> = [
  { action: 'create', allow: { none: AUTHORS } },
  { action: 'read', allow: { none: ['*'] } },
  { action: 'update', allow: { none: AUTHORS } },
  { action: 'delete', allow: { none: AUTHORS } },
];

// Characteristic groups + characteristics are global content, same policy.
export const characteristicGroupPolicy: Policy<CharacteristicGroupEntity> = [
  { action: 'create', allow: { none: AUTHORS } },
  { action: 'read', allow: { none: ['*'] } },
  { action: 'update', allow: { none: AUTHORS } },
  { action: 'delete', allow: { none: AUTHORS } },
];

export const characteristicPolicy: Policy<CharacteristicEntity> = [
  { action: 'create', allow: { none: AUTHORS } },
  { action: 'read', allow: { none: ['*'] } },
  { action: 'update', allow: { none: AUTHORS } },
  { action: 'delete', allow: { none: AUTHORS } },
];
