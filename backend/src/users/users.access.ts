import { createAccess } from '../common/access/create-access';
import { AuthUser, Relationship } from '../common/access/types';
import { USER_ACTIONS, userPolicy } from './users.policy';
import { UserEntity } from './users.types';

/** `owner` when the caller is the same user; otherwise `none`. */
export function relationshipTo(entity: UserEntity | null, user: AuthUser): Relationship {
  if (entity && entity.id === user.id) return 'owner';
  return 'none';
}

export const { can, capabilitiesFor } = createAccess<UserEntity>({
  name: 'user',
  policy: userPolicy,
  actions: [...USER_ACTIONS],
  // Authorization needs only id/relationship — omit the hash so a leaked load can't expose it.
  load: (db, id) =>
    db.user.findUnique({ where: { id }, omit: { passwordHash: true } }) as Promise<UserEntity | null>,
  relationshipTo,
});

export type UserCapabilities = ReturnType<typeof capabilitiesFor>;
