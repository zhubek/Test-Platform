import { createAccess } from '../common/access/create-access';
import { AuthUser, Relationship } from '../common/access/types';
import { PROJECT_ACTIONS, projectPolicy } from './projects.policy';
import { ProjectEntity } from './projects.types';

/** A caller is `org` to a project iff they're assigned to it; else `none`. */
export function relationshipTo(project: ProjectEntity | null, user: AuthUser): Relationship {
  if (project && user.projectId === project.id) return 'org';
  return 'none';
}

export const { can, capabilitiesFor } = createAccess<ProjectEntity>({
  name: 'project',
  policy: projectPolicy,
  actions: [...PROJECT_ACTIONS],
  relationshipTo,
  load: (db, id) => db.project.findUnique({ where: { id } }),
});

export type ProjectCapabilities = ReturnType<typeof capabilitiesFor>;
