-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "LicenseState" AS ENUM ('ISSUED', 'ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ParamType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "passwordHash" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "organizationId" TEXT,
    "licenseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "UserProject" (
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProject_pkey" PRIMARY KEY ("userId","projectId")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "licenseLimit" INTEGER NOT NULL DEFAULT 0,
    "licenseUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectLanguage" (
    "projectId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,

    CONSTRAINT "ProjectLanguage_pkey" PRIMARY KEY ("projectId","languageId")
);

-- CreateTable
CREATE TABLE "ProjectParam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ParamType" NOT NULL DEFAULT 'STRING',
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectParam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectParamOption" (
    "id" TEXT NOT NULL,
    "value_text" TEXT NOT NULL,
    "projectParamId" TEXT NOT NULL,

    CONSTRAINT "ProjectParamOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "licenseCount" INTEGER NOT NULL DEFAULT 0,
    "licenseUsed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "licenseCode" TEXT NOT NULL,
    "state" "LicenseState" NOT NULL DEFAULT 'ISSUED',
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expirationDate" TIMESTAMP(3),
    "issuedById" TEXT,
    "projectId" TEXT NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseParamOption" (
    "licenseId" TEXT NOT NULL,
    "projectParamOptionId" TEXT NOT NULL,

    CONSTRAINT "LicenseParamOption_pkey" PRIMARY KEY ("licenseId","projectParamOptionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_licenseId_key" ON "User"("licenseId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_code_key" ON "Organization"("code");

-- CreateIndex
CREATE INDEX "Organization_projectId_idx" ON "Organization"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "License_licenseCode_key" ON "License"("licenseCode");

-- CreateIndex
CREATE INDEX "License_projectId_idx" ON "License"("projectId");

-- CreateIndex
CREATE INDEX "License_organizationId_idx" ON "License"("organizationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProject" ADD CONSTRAINT "UserProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProject" ADD CONSTRAINT "UserProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLanguage" ADD CONSTRAINT "ProjectLanguage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectLanguage" ADD CONSTRAINT "ProjectLanguage_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectParam" ADD CONSTRAINT "ProjectParam_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectParamOption" ADD CONSTRAINT "ProjectParamOption_projectParamId_fkey" FOREIGN KEY ("projectParamId") REFERENCES "ProjectParam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseParamOption" ADD CONSTRAINT "LicenseParamOption_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseParamOption" ADD CONSTRAINT "LicenseParamOption_projectParamOptionId_fkey" FOREIGN KEY ("projectParamOptionId") REFERENCES "ProjectParamOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
