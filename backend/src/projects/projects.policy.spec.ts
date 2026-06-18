import { ROLES } from '../auth/roles';
import { AuthUser } from '../common/access/types';
import { can } from './projects.access';
import { PROJECT_ACTIONS } from './projects.policy';

const project = { id: 'p1' } as any;

function user(roles: string[], projectId?: string): AuthUser {
  return { id: 'u1', roles, projectId };
}

const superAdmin = user([ROLES.SUPER_ADMIN]);
const paAssigned = user([ROLES.PROJECT_ADMIN], 'p1');
const paOther = user([ROLES.PROJECT_ADMIN], 'p2');
const orgAdmin = user([ROLES.ORG_ADMIN]);
const holder = user([ROLES.LICENSE_HOLDER]);

describe('project policy', () => {
  describe('create (no entity yet)', () => {
    it('allows only super_admin', () => {
      expect(can('create', null, superAdmin)).toBe(true);
      expect(can('create', null, paAssigned)).toBe(false);
      expect(can('create', null, orgAdmin)).toBe(false);
      expect(can('create', null, holder)).toBe(false);
    });
  });

  describe('delete', () => {
    it('allows only super_admin (even an assigned project_admin cannot)', () => {
      expect(can('delete', project, superAdmin)).toBe(true);
      expect(can('delete', project, paAssigned)).toBe(false);
    });
  });

  describe.each(['read', 'update', 'createOrganization', 'manageLanguages', 'manageParams'])(
    '%s',
    (action) => {
      it('super_admin: always', () => expect(can(action, project, superAdmin)).toBe(true));
      it('project_admin assigned: yes', () => expect(can(action, project, paAssigned)).toBe(true));
      it('project_admin not assigned: no', () => expect(can(action, project, paOther)).toBe(false));
      it('org_admin: no', () => expect(can(action, project, orgAdmin)).toBe(false));
      it('license_holder: no', () => expect(can(action, project, holder)).toBe(false));
    },
  );

  it('denies an unknown action to everyone', () => {
    for (const u of [superAdmin, paAssigned, orgAdmin, holder]) {
      expect(can('nonsense', project, u)).toBe(false);
    }
  });

  it('every declared action is covered by this suite', () => {
    expect([...PROJECT_ACTIONS].sort()).toEqual(
      ['create', 'delete', 'read', 'update', 'createOrganization', 'manageLanguages', 'manageParams'].sort(),
    );
  });
});
