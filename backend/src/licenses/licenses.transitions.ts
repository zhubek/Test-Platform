import { License, LicenseState } from '@prisma/client';

/**
 * Legal license state moves + entity-DATA readiness conditions. PURE: no DB,
 * no user, no side-effects. Condition failures are about the ENTITY (-> 422),
 * never about who the caller is (that's the policy's job). Activation
 * (ISSUED -> ACTIVE) happens via the holder's activation flow, not here.
 */
export interface Transition {
  to: LicenseState;
  condition?: (entity: License) => boolean;
  failReason?: string;
}

function notExpired(license: License): boolean {
  return !license.expirationDate || license.expirationDate.getTime() > Date.now();
}

export const LICENSE_TRANSITIONS: Record<LicenseState, Transition[]> = {
  ISSUED: [
    { to: 'ACTIVE', condition: notExpired, failReason: 'License expiration date has already passed' },
    { to: 'REVOKED' },
    { to: 'EXPIRED' },
  ],
  ACTIVE: [{ to: 'REVOKED' }, { to: 'EXPIRED' }],
  EXPIRED: [
    { to: 'ACTIVE', condition: notExpired, failReason: 'License expiration date has already passed' },
    { to: 'REVOKED' },
  ],
  REVOKED: [], // terminal
};

export function canTransition(
  from: LicenseState,
  to: LicenseState,
  entity: License,
): { ok: boolean; reason?: string } {
  const transition = LICENSE_TRANSITIONS[from].find((t) => t.to === to);
  if (!transition) return { ok: false, reason: `Cannot move license from ${from} to ${to}` };
  if (transition.condition && !transition.condition(entity)) {
    return { ok: false, reason: transition.failReason ?? 'License is not ready for this transition' };
  }
  return { ok: true };
}
