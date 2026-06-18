-- CreateEnum
CREATE TYPE "TestState" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TestSurface" AS ENUM ('QUESTION', 'RESULT', 'DASHBOARD');

-- CreateEnum
CREATE TYPE "LicenseTestState" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED');

-- CreateTable
CREATE TABLE "test_tests" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" JSONB NOT NULL DEFAULT '{}',
    "category" JSONB NOT NULL DEFAULT '{}',
    "state" "TestState" NOT NULL DEFAULT 'DRAFT',
    "info" JSONB NOT NULL DEFAULT '{}',
    "advanced_params" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_blocks" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "surface" "TestSurface" NOT NULL DEFAULT 'QUESTION',
    "order" INTEGER NOT NULL DEFAULT 0,
    "props" JSONB NOT NULL DEFAULT '{}',
    "advanced_params" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_license_tests" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "state" "LicenseTestState" NOT NULL DEFAULT 'NOT_STARTED',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "progress" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_license_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_license_test_variables" (
    "id" TEXT NOT NULL,
    "licenseTestId" TEXT NOT NULL,
    "variable" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "test_license_test_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_project_params" (
    "testId" TEXT NOT NULL,
    "projectParamId" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "test_project_params_pkey" PRIMARY KEY ("testId","projectParamId")
);

-- CreateIndex
CREATE INDEX "test_tests_projectId_idx" ON "test_tests"("projectId");

-- CreateIndex
CREATE INDEX "test_blocks_testId_surface_order_idx" ON "test_blocks"("testId", "surface", "order");

-- CreateIndex
CREATE INDEX "test_blocks_blockId_idx" ON "test_blocks"("blockId");

-- CreateIndex
CREATE INDEX "test_license_tests_testId_idx" ON "test_license_tests"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "test_license_tests_licenseId_testId_key" ON "test_license_tests"("licenseId", "testId");

-- CreateIndex
CREATE UNIQUE INDEX "test_license_test_variables_licenseTestId_variable_key" ON "test_license_test_variables"("licenseTestId", "variable");

-- AddForeignKey
ALTER TABLE "test_tests" ADD CONSTRAINT "test_tests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "core_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_blocks" ADD CONSTRAINT "test_blocks_testId_fkey" FOREIGN KEY ("testId") REFERENCES "test_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_blocks" ADD CONSTRAINT "test_blocks_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "uc_blocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_license_tests" ADD CONSTRAINT "test_license_tests_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "core_licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_license_tests" ADD CONSTRAINT "test_license_tests_testId_fkey" FOREIGN KEY ("testId") REFERENCES "test_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_license_test_variables" ADD CONSTRAINT "test_license_test_variables_licenseTestId_fkey" FOREIGN KEY ("licenseTestId") REFERENCES "test_license_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_project_params" ADD CONSTRAINT "test_project_params_testId_fkey" FOREIGN KEY ("testId") REFERENCES "test_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_project_params" ADD CONSTRAINT "test_project_params_projectParamId_fkey" FOREIGN KEY ("projectParamId") REFERENCES "core_project_params"("id") ON DELETE CASCADE ON UPDATE CASCADE;
