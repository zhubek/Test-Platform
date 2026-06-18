-- AlterTable
ALTER TABLE "dc_catalog_groups" ADD COLUMN     "cardPageId" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "dc_extra_variables" ADD COLUMN     "filterable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'text';
