-- AlterTable
ALTER TABLE "core_organizations" ADD COLUMN     "expirationDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "core_projects" ADD COLUMN     "expirationDate" TIMESTAMP(3);
