-- AlterTable
ALTER TABLE "test_license_test_variables" ADD COLUMN     "refId" TEXT,
ADD COLUMN     "refType" TEXT;

-- CreateIndex
CREATE INDEX "test_license_test_variables_refId_idx" ON "test_license_test_variables"("refId");

-- AddForeignKey
ALTER TABLE "test_license_test_variables" ADD CONSTRAINT "test_license_test_variables_refId_fkey" FOREIGN KEY ("refId") REFERENCES "dc_catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
