-- Add `kind` + denormalized `testId` to result variables, with backfill.

-- CreateEnum
CREATE TYPE "LicenseTestVarKind" AS ENUM ('ANSWER', 'VARIABLE', 'REFERENCE');

-- AlterTable: kind with default; testId added NULLABLE first for backfill.
ALTER TABLE "test_license_test_variables"
  ADD COLUMN "kind" "LicenseTestVarKind" NOT NULL DEFAULT 'VARIABLE',
  ADD COLUMN "testId" TEXT;

-- Backfill testId from the parent attempt (immutable per attempt).
UPDATE "test_license_test_variables" v
SET "testId" = lt."testId"
FROM "test_license_tests" lt
WHERE v."licenseTestId" = lt."id";

-- Backfill kind for existing rows: references (have a refId) → REFERENCE;
-- question answers (named q1, q2, …) → ANSWER; everything else stays VARIABLE.
UPDATE "test_license_test_variables" SET "kind" = 'REFERENCE' WHERE "refId" IS NOT NULL;
UPDATE "test_license_test_variables" SET "kind" = 'ANSWER'
  WHERE "refId" IS NULL AND "variable" ~ '^q[0-9]+$';

-- Now enforce NOT NULL.
ALTER TABLE "test_license_test_variables" ALTER COLUMN "testId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "test_license_test_variables_testId_kind_variable_idx"
  ON "test_license_test_variables"("testId", "kind", "variable");

-- AddForeignKey
ALTER TABLE "test_license_test_variables"
  ADD CONSTRAINT "test_license_test_variables_testId_fkey"
  FOREIGN KEY ("testId") REFERENCES "test_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
