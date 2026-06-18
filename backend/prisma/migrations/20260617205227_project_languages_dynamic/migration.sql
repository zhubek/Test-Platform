-- AlterTable
ALTER TABLE "core_languages" ADD COLUMN     "label" TEXT;

-- AlterTable
ALTER TABLE "core_projects" ADD COLUMN     "defaultLanguageId" TEXT;

-- AddForeignKey
ALTER TABLE "core_projects" ADD CONSTRAINT "core_projects_defaultLanguageId_fkey" FOREIGN KEY ("defaultLanguageId") REFERENCES "core_languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
