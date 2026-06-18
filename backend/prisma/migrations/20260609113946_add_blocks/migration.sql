-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('TEST', 'RESULT', 'DASHBOARD', 'CATALOG');

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "type" "BlockType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "html" TEXT NOT NULL DEFAULT '',
    "props" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Block_type_idx" ON "Block"("type");
