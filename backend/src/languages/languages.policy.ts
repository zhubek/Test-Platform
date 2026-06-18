import { ROLES } from '../auth/roles';
import { Policy } from '../common/access/types';
import { LanguageEntity } from './languages.types';

/**
 * Language is a GLOBAL catalog (not project-scoped), so relationship is always
 * `none`. The catalog is edited by super_admin; any authenticated user may read
 * it. Assigning a language to a project is a Project action (`manageLanguages`).
 */
export const LANGUAGE_ACTIONS = ['create', 'read', 'update', 'delete'] as const;
export type LanguageAction = (typeof LANGUAGE_ACTIONS)[number];

export const languagePolicy: Policy<LanguageEntity> = [
  { action: 'create', allow: { none: [ROLES.SUPER_ADMIN] } },
  { action: 'read', allow: { none: ['*'] } }, // any authenticated user
  { action: 'update', allow: { none: [ROLES.SUPER_ADMIN] } },
  { action: 'delete', allow: { none: [ROLES.SUPER_ADMIN] } },
];
