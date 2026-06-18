-- DropForeignKey
ALTER TABLE "License" DROP CONSTRAINT "License_issuedById_fkey";

-- DropForeignKey
ALTER TABLE "License" DROP CONSTRAINT "License_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "License" DROP CONSTRAINT "License_projectId_fkey";

-- DropForeignKey
ALTER TABLE "LicenseParamOption" DROP CONSTRAINT "LicenseParamOption_licenseId_fkey";

-- DropForeignKey
ALTER TABLE "LicenseParamOption" DROP CONSTRAINT "LicenseParamOption_projectParamOptionId_fkey";

-- DropForeignKey
ALTER TABLE "Organization" DROP CONSTRAINT "Organization_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectLanguage" DROP CONSTRAINT "ProjectLanguage_languageId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectLanguage" DROP CONSTRAINT "ProjectLanguage_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectParam" DROP CONSTRAINT "ProjectParam_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectParamOption" DROP CONSTRAINT "ProjectParamOption_projectParamId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_licenseId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_projectId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_userId_fkey";

-- DropTable
DROP TABLE "Block";

-- DropTable
DROP TABLE "Language";

-- DropTable
DROP TABLE "License";

-- DropTable
DROP TABLE "LicenseParamOption";

-- DropTable
DROP TABLE "Organization";

-- DropTable
DROP TABLE "Project";

-- DropTable
DROP TABLE "ProjectLanguage";

-- DropTable
DROP TABLE "ProjectParam";

-- DropTable
DROP TABLE "ProjectParamOption";

-- DropTable
DROP TABLE "Role";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "UserRole";

-- CreateTable
CREATE TABLE "core_users" (
    "id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "passwordHash" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "projectId" TEXT,
    "projectRole" "ProjectRole",
    "organizationId" TEXT,
    "licenseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "core_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "core_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_user_roles" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "core_user_roles_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "core_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "licenseLimit" INTEGER NOT NULL DEFAULT 0,
    "licenseUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "core_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_languages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "core_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_project_languages" (
    "projectId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,

    CONSTRAINT "core_project_languages_pkey" PRIMARY KEY ("projectId","languageId")
);

-- CreateTable
CREATE TABLE "uc_blocks" (
    "id" TEXT NOT NULL,
    "type" "BlockType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "html" TEXT NOT NULL DEFAULT '',
    "props" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uc_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_project_params" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ParamType" NOT NULL DEFAULT 'STRING',
    "projectId" TEXT NOT NULL,

    CONSTRAINT "core_project_params_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_project_param_options" (
    "id" TEXT NOT NULL,
    "value_text" TEXT NOT NULL,
    "projectParamId" TEXT NOT NULL,

    CONSTRAINT "core_project_param_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_organizations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "licenseCount" INTEGER NOT NULL DEFAULT 0,
    "licenseUsed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "core_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_licenses" (
    "id" TEXT NOT NULL,
    "licenseCode" TEXT NOT NULL,
    "state" "LicenseState" NOT NULL DEFAULT 'ISSUED',
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expirationDate" TIMESTAMP(3),
    "issuedById" TEXT,
    "projectId" TEXT NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "core_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_license_param_options" (
    "licenseId" TEXT NOT NULL,
    "projectParamOptionId" TEXT NOT NULL,

    CONSTRAINT "core_license_param_options_pkey" PRIMARY KEY ("licenseId","projectParamOptionId")
);

-- CreateTable
CREATE TABLE "dc_catalog_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "info" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dc_catalog_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dc_extra_variables" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "varName" TEXT NOT NULL,
    "hasOptions" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "dc_extra_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dc_extra_variable_options" (
    "id" TEXT NOT NULL,
    "variableId" TEXT NOT NULL,
    "optionValue" JSONB NOT NULL,

    CONSTRAINT "dc_extra_variable_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dc_catalogs" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB,
    "params" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dc_catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dc_catalog_extra_values" (
    "id" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "variableId" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "dc_catalog_extra_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dc_group_pages" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "pageName" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "dc_group_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dc_group_page_blocks" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "props" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "dc_group_page_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dc_catalog_page_props" (
    "id" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "pageBlockId" TEXT NOT NULL,
    "props" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "dc_catalog_page_props_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "core_users_login_key" ON "core_users"("login");

-- CreateIndex
CREATE UNIQUE INDEX "core_users_email_key" ON "core_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "core_users_licenseId_key" ON "core_users"("licenseId");

-- CreateIndex
CREATE UNIQUE INDEX "core_roles_name_key" ON "core_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "core_languages_name_key" ON "core_languages"("name");

-- CreateIndex
CREATE INDEX "uc_blocks_type_idx" ON "uc_blocks"("type");

-- CreateIndex
CREATE UNIQUE INDEX "core_organizations_code_key" ON "core_organizations"("code");

-- CreateIndex
CREATE INDEX "core_organizations_projectId_idx" ON "core_organizations"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "core_licenses_licenseCode_key" ON "core_licenses"("licenseCode");

-- CreateIndex
CREATE INDEX "core_licenses_projectId_idx" ON "core_licenses"("projectId");

-- CreateIndex
CREATE INDEX "core_licenses_organizationId_idx" ON "core_licenses"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "dc_catalog_groups_name_key" ON "dc_catalog_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "dc_extra_variables_groupId_varName_key" ON "dc_extra_variables"("groupId", "varName");

-- CreateIndex
CREATE INDEX "dc_catalogs_groupId_idx" ON "dc_catalogs"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "dc_catalog_extra_values_catalogId_variableId_key" ON "dc_catalog_extra_values"("catalogId", "variableId");

-- CreateIndex
CREATE INDEX "dc_group_pages_groupId_idx" ON "dc_group_pages"("groupId");

-- CreateIndex
CREATE INDEX "dc_group_page_blocks_pageId_idx" ON "dc_group_page_blocks"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "dc_catalog_page_props_catalogId_pageBlockId_key" ON "dc_catalog_page_props"("catalogId", "pageBlockId");

-- AddForeignKey
ALTER TABLE "core_users" ADD CONSTRAINT "core_users_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "core_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_users" ADD CONSTRAINT "core_users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "core_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_users" ADD CONSTRAINT "core_users_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "core_licenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_user_roles" ADD CONSTRAINT "core_user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "core_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_user_roles" ADD CONSTRAINT "core_user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "core_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_project_languages" ADD CONSTRAINT "core_project_languages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "core_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_project_languages" ADD CONSTRAINT "core_project_languages_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "core_languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_project_params" ADD CONSTRAINT "core_project_params_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "core_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_project_param_options" ADD CONSTRAINT "core_project_param_options_projectParamId_fkey" FOREIGN KEY ("projectParamId") REFERENCES "core_project_params"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_organizations" ADD CONSTRAINT "core_organizations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "core_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_licenses" ADD CONSTRAINT "core_licenses_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "core_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_licenses" ADD CONSTRAINT "core_licenses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "core_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_licenses" ADD CONSTRAINT "core_licenses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "core_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_license_param_options" ADD CONSTRAINT "core_license_param_options_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "core_licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_license_param_options" ADD CONSTRAINT "core_license_param_options_projectParamOptionId_fkey" FOREIGN KEY ("projectParamOptionId") REFERENCES "core_project_param_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_extra_variables" ADD CONSTRAINT "dc_extra_variables_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "dc_catalog_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_extra_variable_options" ADD CONSTRAINT "dc_extra_variable_options_variableId_fkey" FOREIGN KEY ("variableId") REFERENCES "dc_extra_variables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_catalogs" ADD CONSTRAINT "dc_catalogs_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "dc_catalog_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_catalog_extra_values" ADD CONSTRAINT "dc_catalog_extra_values_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "dc_catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_catalog_extra_values" ADD CONSTRAINT "dc_catalog_extra_values_variableId_fkey" FOREIGN KEY ("variableId") REFERENCES "dc_extra_variables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_group_pages" ADD CONSTRAINT "dc_group_pages_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "dc_catalog_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_group_page_blocks" ADD CONSTRAINT "dc_group_page_blocks_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "dc_group_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_group_page_blocks" ADD CONSTRAINT "dc_group_page_blocks_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "uc_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_catalog_page_props" ADD CONSTRAINT "dc_catalog_page_props_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "dc_catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_catalog_page_props" ADD CONSTRAINT "dc_catalog_page_props_pageBlockId_fkey" FOREIGN KEY ("pageBlockId") REFERENCES "dc_group_page_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
