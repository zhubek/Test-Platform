import { ROLES } from '../auth/roles';
import { AuthUser } from '../common/access/types';
import { can } from './users.access';

function user(id: string, roles: string[]): AuthUser {
  return { id, roles };
}

const superAdmin = user('super', [ROLES.SUPER_ADMIN]);
const pa = user('pa', [ROLES.PROJECT_ADMIN]);
const holder = user('h', [ROLES.LICENSE_HOLDER]);

const self = { id: 'pa' } as any; // the user record that belongs to `pa`
const other = { id: 'someone-else' } as any;

describe('user policy', () => {
  it('only super_admin creates accounts', () => {
    expect(can('create', null, superAdmin)).toBe(true);
    expect(can('create', null, pa)).toBe(false);
    expect(can('create', null, holder)).toBe(false);
  });

  it('a user can read/update their OWN record', () => {
    expect(can('read', self, pa)).toBe(true);
    expect(can('update', self, pa)).toBe(true);
  });

  it('a user canNOT read/update someone else (only super_admin can)', () => {
    expect(can('read', other, pa)).toBe(false);
    expect(can('update', other, pa)).toBe(false);
    expect(can('read', other, superAdmin)).toBe(true);
    expect(can('update', other, superAdmin)).toBe(true);
  });

  it.each(['delete', 'assignRole', 'assignProject', 'disable'])(
    'admin action "%s" is super_admin-only (not even on self)',
    (action) => {
      expect(can(action, self, superAdmin)).toBe(true);
      expect(can(action, self, pa)).toBe(false);
      expect(can(action, other, pa)).toBe(false);
    },
  );
});
