-- Replace the UserProject join table with projectId + projectRole on User.

-- DropTable
DROP TABLE "UserProject";

-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('SUPER_ADMIN', 'PROJECT_ADMIN', 'ORG_ADMIN', 'LICENSE_HOLDER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "projectRole" "ProjectRole";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
