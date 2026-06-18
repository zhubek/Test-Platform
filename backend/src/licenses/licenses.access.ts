import { createAccess } from '../common/access/create-access';
import { AuthUser, Relationship } from '../common/access/types';
import { LICENSE_ACTIONS, licensePolicy } from './licenses.policy';
import { LicenseEntity } from './licenses.types';

/**
 * `owner` if the caller IS this license's holder; `org` if they're an org_admin
 * of its org or a project_admin of its project; otherwise `none`.
 */
export function relationshipTo(license: LicenseEntity | null, user: AuthUser): Relationship {
  if (!license) return 'none';
  if (user.licenseId === license.id) return 'owner';
  if (user.orgId && license.organizationId === user.orgId) return 'org';
  if (user.projectId === license.projectId) return 'org';
  return 'none';
}

export const { can, capabilitiesFor } = createAccess<LicenseEntity>({
  name: 'license',
  policy: licensePolicy,
  actions: [...LICENSE_ACTIONS],
  relationshipTo,
  load: (db, id) => db.license.findUnique({ where: { id } }),
});

export type LicenseCapabilities = ReturnType<typeof capabilitiesFor>;
