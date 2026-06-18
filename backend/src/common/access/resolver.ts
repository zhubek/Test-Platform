import { AuthUser, Policy, Relationship, RelationshipFn } from './types';

/**
 * The SINGLE decision algorithm for every entity. Pure — no I/O, no DB.
 * Both the enforcement guard (`can`) and the UI hints (`capabilitiesFor`)
 * run through here, so they can never disagree.
 */

const RANK: Record<Relationship, number> = { owner: 3, team: 2, org: 1, none: 0 };

function rolesMatch(allowed: string[] | undefined, userRoles: string[]): boolean {
  if (!allowed || allowed.length === 0) return false;
  if (allowed.includes('*')) return true;
  return allowed.some((role) => userRoles.includes(role));
}

export function evaluatePolicy<E>(
  policy: Policy<E>,
  action: string,
  entity: E | null,
  user: AuthUser,
  relationshipOf: RelationshipFn<E>,
  now: Date = new Date(),
): boolean {
  const relRank = RANK[relationshipOf(entity, user)];
  const state =
    entity && typeof entity === 'object' ? (entity as { state?: string }).state : undefined;

  for (const rule of policy) {
    if (rule.action !== action) continue;

    // State gate (only when the rule constrains state).
    if (rule.allowedStates && rule.allowedStates.length > 0) {
      if (state === undefined || !rule.allowedStates.includes(state)) continue;
    }

    // Relationship + role gate: a caller satisfies any allow-entry at or below
    // their relationship strength (an owner also has org-level access).
    const relMatch = (Object.keys(rule.allow) as Relationship[]).some(
      (key) => RANK[key] <= relRank && rolesMatch(rule.allow[key], user.roles),
    );
    if (!relMatch) continue;

    // Permission conditions (AND, pure entity predicates).
    if (rule.conditions && !rule.conditions.every((c) => c(entity as E, now))) continue;

    return true; // any fully-matching rule grants access (OR across rules)
  }
  return false;
}

export interface Capabilities {
  availableActions: string[];
  /** One boolean flag per action name (e.g. capabilities.edit === true). */
  [action: string]: boolean | string[];
}

export function buildCapabilities<E>(
  policy: Policy<E>,
  actions: string[],
  entity: E | null,
  user: AuthUser,
  relationshipOf: RelationshipFn<E>,
): Capabilities {
  const flags: Record<string, boolean> = {};
  const availableActions: string[] = [];
  for (const action of actions) {
    const ok = evaluatePolicy(policy, action, entity, user, relationshipOf);
    flags[action] = ok;
    if (ok) availableActions.push(action);
  }
  return { ...flags, availableActions };
}
