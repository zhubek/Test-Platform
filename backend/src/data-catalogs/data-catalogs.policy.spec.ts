import { ROLES } from '../auth/roles';
import { AuthUser } from '../common/access/types';
import { canGroup, canItem } from './data-catalogs.access';

function user(roles: string[]): AuthUser {
  return { id: 'u', roles };
}

const superAdmin = user([ROLES.SUPER_ADMIN]);
const projectAdmin = user([ROLES.PROJECT_ADMIN]);
const orgAdmin = user([ROLES.ORG_ADMIN]);
const holder = user([ROLES.LICENSE_HOLDER]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const group = { id: 'g1' } as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const item = { id: 'i1' } as any;

describe('data-catalogs policies (global content)', () => {
  it('any authenticated user can read groups and items', () => {
    for (const u of [superAdmin, projectAdmin, orgAdmin, holder]) {
      expect(canGroup('read', group, u)).toBe(true);
      expect(canGroup('read', null, u)).toBe(true); // list (no entity)
      expect(canItem('read', item, u)).toBe(true);
    }
  });

  it.each(['create', 'update', 'delete'])(
    'mutating "%s" is allowed for super_admin and project_admin only',
    (action) => {
      expect(canGroup(action, group, superAdmin)).toBe(true);
      expect(canGroup(action, group, projectAdmin)).toBe(true);
      expect(canGroup(action, group, orgAdmin)).toBe(false);
      expect(canGroup(action, group, holder)).toBe(false);
      expect(canItem(action, item, superAdmin)).toBe(true);
      expect(canItem(action, item, projectAdmin)).toBe(true);
      expect(canItem(action, item, orgAdmin)).toBe(false);
      expect(canItem(action, item, holder)).toBe(false);
    },
  );
});
