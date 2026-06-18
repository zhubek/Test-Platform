import { LicenseTestState } from '@prisma/client';

/**
 * Legal attempt-state moves. PURE: no DB, no user, no side-effects. COMPLETED
 * and EXPIRED are terminal.
 */
export const LICENSE_TEST_TRANSITIONS: Record<LicenseTestState, LicenseTestState[]> = {
  NOT_STARTED: ['IN_PROGRESS', 'EXPIRED'],
  IN_PROGRESS: ['COMPLETED', 'EXPIRED'],
  COMPLETED: [],
  EXPIRED: [],
};

export function canTransition(
  from: LicenseTestState,
  to: LicenseTestState,
): { ok: boolean; reason?: string } {
  if (!LICENSE_TEST_TRANSITIONS[from].includes(to)) {
    return { ok: false, reason: `Cannot move attempt from ${from} to ${to}` };
  }
  return { ok: true };
}
