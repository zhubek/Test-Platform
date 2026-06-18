import { createAccess } from '../common/access/create-access';
import { AuthUser, Relationship } from '../common/access/types';
import { ORGANIZATION_ACTIONS, organizationPolicy } from './organizations.policy';
import { OrganizationEntity } from './organizations.types';

/**
 * `org` if the caller is this org's org_admin OR a project_admin assigned to
 * the org's project; otherwise `none` (super-admin is granted at `none`).
 */
export function relationshipTo(org: OrganizationEntity | null, user: AuthUser): Relationship {
  if (!org) return 'none';
  if (user.orgId === org.id) return 'org';
  if (user.projectId === org.projectId) return 'org';
  return 'none';
}

export const { can, capabilitiesFor } = createAccess<OrganizationEntity>({
  name: 'organization',
  policy: organizationPolicy,
  actions: [...ORGANIZATION_ACTIONS],
  relationshipTo,
  load: (db, id) => db.organization.findUnique({ where: { id } }),
});

export type OrganizationCapabilities = ReturnType<typeof capabilitiesFor>;
