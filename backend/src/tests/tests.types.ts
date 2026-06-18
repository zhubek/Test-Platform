import { LicenseTest, Test } from '@prisma/client';

export type TestEntity = Test;

// The LicenseTest as loaded for authorization: its owning license carries the
// project/org so relationshipTo can place project_admins (org) vs the holder
// (owner).
export type LicenseTestEntity = LicenseTest & {
  license: { projectId: string; organizationId: string | null } | null;
};
