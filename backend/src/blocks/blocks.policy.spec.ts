import { ROLES } from '../auth/roles';
import { AuthUser } from '../common/access/types';
import { can } from './blocks.access';

function user(roles: string[]): AuthUser {
  return { id: 'u', roles };
}

const superAdmin = user([ROLES.SUPER_ADMIN]);
const projectAdmin = user([ROLES.PROJECT_ADMIN]);
const orgAdmin = user([ROLES.ORG_ADMIN]);
const holder = user([ROLES.LICENSE_HOLDER]);
const block = { id: 'b1' } as any;

describe('block policy (global library)', () => {
  it('any authenticated user can read', () => {
    for (const u of [superAdmin, projectAdmin, orgAdmin, holder]) {
      expect(can('read', block, u)).toBe(true);
      expect(can('read', null, u)).toBe(true); // list (no entity)
    }
  });

  it.each(['create', 'update', 'delete'])(
    'mutating "%s" is allowed for super_admin and project_admin only',
    (action) => {
      expect(can(action, block, superAdmin)).toBe(true);
      expect(can(action, block, projectAdmin)).toBe(true);
      expect(can(action, block, orgAdmin)).toBe(false);
      expect(can(action, block, holder)).toBe(false);
    },
  );
});
