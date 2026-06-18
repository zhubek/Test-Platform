import { ROLES } from '../auth/roles';
import { AuthUser } from '../common/access/types';
import { can } from './languages.access';

function user(roles: string[]): AuthUser {
  return { id: 'u', roles };
}

const superAdmin = user([ROLES.SUPER_ADMIN]);
const pa = user([ROLES.PROJECT_ADMIN]);
const holder = user([ROLES.LICENSE_HOLDER]);
const language = { id: 'en' } as any;

describe('language policy (global catalog)', () => {
  it('any authenticated user can read', () => {
    for (const u of [superAdmin, pa, holder]) {
      expect(can('read', language, u)).toBe(true);
      expect(can('read', null, u)).toBe(true); // list (no entity)
    }
  });

  it.each(['create', 'update', 'delete'])('mutating "%s" is super_admin-only', (action) => {
    expect(can(action, language, superAdmin)).toBe(true);
    expect(can(action, language, pa)).toBe(false);
    expect(can(action, language, holder)).toBe(false);
  });
});
