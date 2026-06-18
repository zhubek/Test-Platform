-- CreateTable
CREATE TABLE "dc_characteristic_groups" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "description" JSONB,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dc_characteristic_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dc_characteristics" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "dc_characteristics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dc_group_characteristic_groups" (
    "catalogGroupId" TEXT NOT NULL,
    "characteristicGroupId" TEXT NOT NULL,

    CONSTRAINT "dc_group_characteristic_groups_pkey" PRIMARY KEY ("catalogGroupId","characteristicGroupId")
);

-- CreateTable
CREATE TABLE "dc_catalog_characteristic_values" (
    "id" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "characteristicId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "dc_catalog_characteristic_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dc_characteristics_groupId_idx" ON "dc_characteristics"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "dc_catalog_characteristic_values_catalogId_characteristicId_key" ON "dc_catalog_characteristic_values"("catalogId", "characteristicId");

-- AddForeignKey
ALTER TABLE "dc_characteristics" ADD CONSTRAINT "dc_characteristics_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "dc_characteristic_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_group_characteristic_groups" ADD CONSTRAINT "dc_group_characteristic_groups_catalogGroupId_fkey" FOREIGN KEY ("catalogGroupId") REFERENCES "dc_catalog_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_group_characteristic_groups" ADD CONSTRAINT "dc_group_characteristic_groups_characteristicGroupId_fkey" FOREIGN KEY ("characteristicGroupId") REFERENCES "dc_characteristic_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_catalog_characteristic_values" ADD CONSTRAINT "dc_catalog_characteristic_values_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "dc_catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dc_catalog_characteristic_values" ADD CONSTRAINT "dc_catalog_characteristic_values_characteristicId_fkey" FOREIGN KEY ("characteristicId") REFERENCES "dc_characteristics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
