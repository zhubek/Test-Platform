import { createAccess } from '../common/access/create-access';
import { AuthUser, Relationship } from '../common/access/types';
import { PARAM_ACTIONS, paramPolicy } from './params.policy';
import { ParamEntity } from './params.types';

/** `org` if the caller is assigned to the param's project; otherwise `none`. */
export function relationshipTo(param: ParamEntity | null, user: AuthUser): Relationship {
  if (param && user.projectId === param.projectId) return 'org';
  return 'none';
}

export const { can, capabilitiesFor } = createAccess<ParamEntity>({
  name: 'param',
  policy: paramPolicy,
  actions: [...PARAM_ACTIONS],
  relationshipTo,
  load: (db, id) => db.projectParam.findUnique({ where: { id } }),
});

export type ParamCapabilities = ReturnType<typeof capabilitiesFor>;
