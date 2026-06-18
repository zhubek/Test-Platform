/**
 * The four principal levels. These are the role names seeded into the Role
 * table and the vocabulary every policy's `allow` map references.
 */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  PROJECT_ADMIN: 'PROJECT_ADMIN',
  ORG_ADMIN: 'ORG_ADMIN',
  LICENSE_HOLDER: 'LICENSE_HOLDER',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: RoleName[] = Object.values(ROLES);
