import { createAccess } from '../common/access/create-access';
import { AuthUser, Relationship } from '../common/access/types';
import { LICENSE_TEST_ACTIONS, licenseTestPolicy } from './license-test.policy';
import { LicenseTestEntity } from './tests.types';

/**
 * The holder OWNS their attempt; a project_admin on the same project is `org`.
 * Identity comes from the JWT (user.licenseId / user.projectId), never the body.
 */
export function relationshipTo(entity: LicenseTestEntity | null, user: AuthUser): Relationship {
  if (!entity) return 'none';
  if (user.licenseId && user.licenseId === entity.licenseId) return 'owner';
  if (entity.license && user.projectId === entity.license.projectId) return 'org';
  return 'none';
}

export const { can, capabilitiesFor } = createAccess<LicenseTestEntity>({
  name: 'licenseTest',
  policy: licenseTestPolicy,
  actions: [...LICENSE_TEST_ACTIONS],
  relationshipTo,
  load: (db, id) =>
    db.licenseTest.findUnique({
      where: { id },
      include: { license: { select: { projectId: true, organizationId: true } } },
    }),
});

export type LicenseTestCapabilities = ReturnType<typeof capabilitiesFor>;
