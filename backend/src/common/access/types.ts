/**
 * Generic access-control types. This file is PURE (no I/O, no NestJS, no Prisma)
 * so the policy engine and its tests stay trivially testable.
 */

/** The caller's relationship to a specific entity, strongest first. */
export type Relationship = 'owner' | 'team' | 'org' | 'none';

/** The authenticated principal, always derived from the verified JWT. */
export interface AuthUser {
  id: string;
  /** Global role names (UserRole) — drives capability in policies. */
  roles: string[];
  /** The single project this user belongs to (undefined for global super_admin). */
  projectId?: string;
  /** Set for org_admin (and resolvable for license_holder): their organization. */
  orgId?: string;
  /** Set for license_holder: the license they own. */
  licenseId?: string;
}

/**
 * A pure predicate over entity fields representing a PERMISSION qualifier
 * (e.g. "editable only within 24h"). Must be side-effect free.
 */
export type Condition<E> = (entity: E, now: Date) => boolean;

export interface AccessRule<E, S extends string = string> {
  action: string;
  /** If set, the entity's `state` must be one of these. Omit for stateless entities. */
  allowedStates?: S[];
  /**
   * relationship -> allowed role names. Use '*' to mean "any authenticated user".
   * Access is granted at a relationship key if the caller's relationship is at
   * least as strong as the key (owner > team > org > none) AND their roles match.
   */
  allow: Partial<Record<Relationship, string[]>>;
  /** All must pass (AND). Pure, entity-only. */
  conditions?: Condition<E>[];
  reason?: string;
}

export type Policy<E, S extends string = string> = AccessRule<E, S>[];

/** Computes the caller's relationship to THIS entity. `entity` is null on create. */
export type RelationshipFn<E> = (entity: E | null, user: AuthUser) => Relationship;
