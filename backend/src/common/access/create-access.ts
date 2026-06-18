import { PrismaService } from '../../prisma/prisma.service';
import { accessRegistry, EntityAccess } from './registry';
import { buildCapabilities, Capabilities, evaluatePolicy } from './resolver';
import { AuthUser, Policy, RelationshipFn } from './types';

export interface CreateAccessConfig<E> {
  /** Entity name used by @RequireAccess and the registry, e.g. 'project'. */
  name: string;
  policy: Policy<E>;
  actions: string[];
  relationshipTo: RelationshipFn<E>;
  /** Fresh DB load for authorization — never trust client fields. */
  load: (db: PrismaService, id: string) => Promise<E | null>;
}

/**
 * The write-once factory. Produces `can` (enforcement) and `capabilitiesFor`
 * (UI hints) from a policy, and registers `{ load, can }` so the generic
 * AccessGuard can authorize this entity. No per-entity algorithm lives here.
 */
export function createAccess<E>(config: CreateAccessConfig<E>): {
  can: (action: string, entity: E | null, user: AuthUser) => boolean;
  capabilitiesFor: (entity: E | null, user: AuthUser) => Capabilities;
} {
  const { name, policy, actions, relationshipTo, load } = config;

  const can = (action: string, entity: E | null, user: AuthUser): boolean =>
    evaluatePolicy(policy, action, entity, user, relationshipTo);

  const capabilitiesFor = (entity: E | null, user: AuthUser): Capabilities =>
    buildCapabilities(policy, actions, entity, user, relationshipTo);

  accessRegistry.register(name, {
    load: load as EntityAccess['load'],
    can: (action, entity, user) => can(action, entity as E | null, user),
  });

  return { can, capabilitiesFor };
}
