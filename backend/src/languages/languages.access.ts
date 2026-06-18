import { createAccess } from '../common/access/create-access';
import { AuthUser, Relationship } from '../common/access/types';
import { LANGUAGE_ACTIONS, languagePolicy } from './languages.policy';
import { LanguageEntity } from './languages.types';

/** Global catalog — no per-entity relationship. */
export function relationshipTo(_language: LanguageEntity | null, _user: AuthUser): Relationship {
  return 'none';
}

export const { can, capabilitiesFor } = createAccess<LanguageEntity>({
  name: 'language',
  policy: languagePolicy,
  actions: [...LANGUAGE_ACTIONS],
  relationshipTo,
  load: (db, id) => db.language.findUnique({ where: { id } }),
});

export type LanguageCapabilities = ReturnType<typeof capabilitiesFor>;
