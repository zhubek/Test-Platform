-- Move the holder FK from User (1:1) to License (1:many): a user can hold many licenses.

-- DropForeignKey
ALTER TABLE "core_users" DROP CONSTRAINT "core_users_licenseId_fkey";

-- DropIndex
DROP INDEX "core_users_licenseId_key";

-- AlterTable: add the new holder FK on the license
ALTER TABLE "core_licenses" ADD COLUMN "holderId" TEXT;

-- Backfill: copy the old 1:1 link (User.licenseId) onto License.holderId
UPDATE "core_licenses" l SET "holderId" = u."id"
FROM "core_users" u
WHERE u."licenseId" = l."id";

-- AlterTable: drop the old 1:1 column
ALTER TABLE "core_users" DROP COLUMN "licenseId";

-- CreateIndex
CREATE INDEX "core_licenses_holderId_idx" ON "core_licenses"("holderId");

-- AddForeignKey
ALTER TABLE "core_licenses" ADD CONSTRAINT "core_licenses_holderId_fkey" FOREIGN KEY ("holderId") REFERENCES "core_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
