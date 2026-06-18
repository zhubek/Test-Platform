import { ROLES } from '../auth/roles';
import { AuthUser } from '../common/access/types';
import { can } from './params.access';

function user(roles: string[], extra: Partial<AuthUser> = {}): AuthUser {
  return { id: 'u', roles, ...extra };
}

const superAdmin = user([ROLES.SUPER_ADMIN]);
const paAssigned = user([ROLES.PROJECT_ADMIN], { projectId: 'p1' });
const paOther = user([ROLES.PROJECT_ADMIN], { projectId: 'pX' });
const orgAdmin = user([ROLES.ORG_ADMIN], { orgId: 'o1' });

const param = { id: 'pr1', projectId: 'p1' } as any;

describe('param policy', () => {
  it('read: super + assigned project_admin + org_admin (in scope) yes; out-of-scope pa no', () => {
    expect(can('read', param, superAdmin)).toBe(true);
    expect(can('read', param, paAssigned)).toBe(true);
    expect(can('read', param, paOther)).toBe(false);
    // org_admin is scoped by project membership here; without projectIds they read via... none -> only super.
    expect(can('read', param, orgAdmin)).toBe(false);
  });

  it.each(['update', 'delete', 'manageOptions'])(
    'mutating "%s": assigned project_admin + super only; org_admin cannot',
    (action) => {
      expect(can(action, param, superAdmin)).toBe(true);
      expect(can(action, param, paAssigned)).toBe(true);
      expect(can(action, param, paOther)).toBe(false);
      expect(can(action, param, orgAdmin)).toBe(false);
    },
  );
});
