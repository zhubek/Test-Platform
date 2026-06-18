import { License } from '@prisma/client';
import { canTransition } from './licenses.transitions';

function license(overrides: Partial<License> = {}): License {
  return { state: 'ISSUED', expirationDate: null, ...overrides } as License;
}

describe('license transitions (pure, entity-readiness only)', () => {
  it('ISSUED -> ACTIVE when not expired', () => {
    expect(canTransition('ISSUED', 'ACTIVE', license())).toEqual({ ok: true });
  });

  it('ISSUED -> ACTIVE blocked (422-style) when expiration has passed', () => {
    const past = new Date(Date.now() - 1000);
    const result = canTransition('ISSUED', 'ACTIVE', license({ expirationDate: past }));
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/expiration/i);
  });

  it('REVOKED is terminal', () => {
    for (const to of ['ISSUED', 'ACTIVE', 'EXPIRED'] as const) {
      expect(canTransition('REVOKED', to, license({ state: 'REVOKED' })).ok).toBe(false);
    }
  });

  it('EXPIRED -> ACTIVE (renew) allowed when extended into the future', () => {
    const future = new Date(Date.now() + 100000);
    expect(canTransition('EXPIRED', 'ACTIVE', license({ state: 'EXPIRED', expirationDate: future })).ok).toBe(true);
  });

  it('rejects undeclared moves with a reason', () => {
    const result = canTransition('ACTIVE', 'ISSUED', license({ state: 'ACTIVE' }));
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('Cannot move');
  });
});
