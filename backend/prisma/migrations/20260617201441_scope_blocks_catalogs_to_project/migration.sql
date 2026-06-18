-- AlterTable
ALTER TABLE "dc_catalog_groups" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "uc_blocks" ADD COLUMN     "projectId" TEXT;

-- CreateIndex
CREATE INDEX "dc_catalog_groups_projectId_idx" ON "dc_catalog_groups"("projectId");

-- CreateIndex
CREATE INDEX "uc_blocks_projectId_idx" ON "uc_blocks"("projectId");

-- AddForeignKey
ALTER TABLE "uc_blocks" ADD CONSTRAINT "uc_blocks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "core_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_catalog_groups" ADD CONSTRAINT "dc_catalog_groups_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "core_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
