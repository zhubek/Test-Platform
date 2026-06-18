import { Test, TestState } from '@prisma/client';

/**
 * Legal publish-state moves for a Test. PURE: no DB, no user, no side-effects.
 * Tests carry no entity-DATA readiness conditions yet (any move between the
 * three states is allowed), so there are no conditions — only the shape of the
 * lifecycle. User permission for each move lives in the policy.
 */
export interface Transition {
  to: TestState;
  condition?: (entity: Test) => boolean;
  failReason?: string;
}

export const TEST_TRANSITIONS: Record<TestState, Transition[]> = {
  DRAFT: [{ to: 'PUBLISHED' }, { to: 'ARCHIVED' }],
  PUBLISHED: [{ to: 'DRAFT' }, { to: 'ARCHIVED' }],
  ARCHIVED: [{ to: 'DRAFT' }, { to: 'PUBLISHED' }],
};

export function canTransition(
  from: TestState,
  to: TestState,
  entity: Test,
): { ok: boolean; reason?: string } {
  const transition = TEST_TRANSITIONS[from].find((t) => t.to === to);
  if (!transition) return { ok: false, reason: `Cannot move test from ${from} to ${to}` };
  if (transition.condition && !transition.condition(entity)) {
    return { ok: false, reason: transition.failReason ?? 'Test is not ready for this transition' };
  }
  return { ok: true };
}
