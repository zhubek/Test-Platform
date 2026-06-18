import { createAccess } from '../common/access/create-access';
import { AuthUser, Relationship } from '../common/access/types';
import { BLOCK_ACTIONS, blockPolicy } from './blocks.policy';
import { BlockEntity } from './blocks.types';

/** Global library — no per-entity relationship. */
export function relationshipTo(_block: BlockEntity | null, _user: AuthUser): Relationship {
  return 'none';
}

export const { can, capabilitiesFor } = createAccess<BlockEntity>({
  name: 'block',
  policy: blockPolicy,
  actions: [...BLOCK_ACTIONS],
  relationshipTo,
  load: (db, id) => db.block.findUnique({ where: { id } }),
});

export type BlockCapabilities = ReturnType<typeof capabilitiesFor>;
