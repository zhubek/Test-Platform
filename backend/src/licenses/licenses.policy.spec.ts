import { LicenseState } from '@prisma/client';
import { ROLES } from '../auth/roles';
import { AuthUser } from '../common/access/types';
import { can } from './licenses.access';

function user(roles: string[], extra: Partial<AuthUser> = {}): AuthUser {
  return { id: 'u1', roles, ...extra };
}

const superAdmin = user([ROLES.SUPER_ADMIN]);
const paAssigned = user([ROLES.PROJECT_ADMIN], { projectId: 'p1' });
const paOther = user([ROLES.PROJECT_ADMIN], { projectId: 'pX' });
const orgAdmin = user([ROLES.ORG_ADMIN], { orgId: 'o1' });
const orgAdminOther = user([ROLES.ORG_ADMIN], { orgId: 'oX' });
const holder = user([ROLES.LICENSE_HOLDER], { licenseId: 'l1' });
const holderOther = user([ROLES.LICENSE_HOLDER], { licenseId: 'lX' });

function license(state: LicenseState = 'ACTIVE', overrides: Record<string, unknown> = {}) {
  return { id: 'l1', projectId: 'p1', organizationId: 'o1', state, expirationDate: null, ...overrides } as any;
}

describe('license policy', () => {
  describe('read (relationship matrix)', () => {
    const lic = license();
    it('owner (the holder) can read', () => expect(can('read', lic, holder)).toBe(true));
    it('a different holder cannot', () => expect(can('read', lic, holderOther)).toBe(false));
    it('org_admin of its org can', () => expect(can('read', lic, orgAdmin)).toBe(true));
    it('org_admin of another org cannot', () => expect(can('read', lic, orgAdminOther)).toBe(false));
    it('project_admin of its project can', () => expect(can('read', lic, paAssigned)).toBe(true));
    it('project_admin of another project cannot', () => expect(can('read', lic, paOther)).toBe(false));
    it('super_admin can', () => expect(can('read', lic, superAdmin)).toBe(true));
  });

  describe('update / delete / resetCode', () => {
    const lic = license();
    it('managers can update; holder cannot', () => {
      expect(can('update', lic, orgAdmin)).toBe(true);
      expect(can('update', lic, paAssigned)).toBe(true);
      expect(can('update', lic, holder)).toBe(false);
    });
    it('delete: project_admin/super only — org_admin cannot', () => {
      expect(can('delete', lic, paAssigned)).toBe(true);
      expect(can('delete', lic, superAdmin)).toBe(true);
      expect(can('delete', lic, orgAdmin)).toBe(false);
      expect(can('delete', lic, holder)).toBe(false);
    });
    it('resetCode: managers yes, holder no', () => {
      expect(can('resetCode', lic, orgAdmin)).toBe(true);
      expect(can('resetCode', lic, holder)).toBe(false);
    });
  });

  describe('lifecycle actions are gated by current state', () => {
    it('revoke/expire allowed only from ISSUED or ACTIVE', () => {
      for (const state of ['ISSUED', 'ACTIVE'] as LicenseState[]) {
        expect(can('revoke', license(state), orgAdmin)).toBe(true);
        expect(can('expire', license(state), orgAdmin)).toBe(true);
      }
      for (const state of ['EXPIRED', 'REVOKED'] as LicenseState[]) {
        expect(can('revoke', license(state), orgAdmin)).toBe(false);
        expect(can('expire', license(state), orgAdmin)).toBe(false);
      }
    });

    it('renew allowed only from EXPIRED', () => {
      expect(can('renew', license('EXPIRED'), orgAdmin)).toBe(true);
      for (const state of ['ISSUED', 'ACTIVE', 'REVOKED'] as LicenseState[]) {
        expect(can('renew', license(state), orgAdmin)).toBe(false);
      }
    });

    it('the holder can never drive lifecycle actions', () => {
      for (const action of ['revoke', 'expire', 'renew']) {
        expect(can(action, license('ACTIVE'), holder)).toBe(false);
        expect(can(action, license('EXPIRED'), holder)).toBe(false);
      }
    });

    it('a manager out of scope is denied even in a valid state', () => {
      expect(can('revoke', license('ACTIVE'), orgAdminOther)).toBe(false);
      expect(can('revoke', license('ACTIVE'), paOther)).toBe(false);
    });
  });
});
