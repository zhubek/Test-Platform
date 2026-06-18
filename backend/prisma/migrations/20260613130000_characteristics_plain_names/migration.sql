-- Characteristic names/descriptions: jsonb Localized → plain text (extract 'en').
ALTER TABLE "dc_characteristic_groups"
  ALTER COLUMN "name" TYPE TEXT USING (COALESCE("name"->>'en', '')),
  ALTER COLUMN "name" SET DEFAULT '';
ALTER TABLE "dc_characteristic_groups"
  ALTER COLUMN "description" TYPE TEXT USING ("description"->>'en');
ALTER TABLE "dc_characteristic_groups"
  ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "dc_characteristics"
  ALTER COLUMN "name" TYPE TEXT USING (COALESCE("name"->>'en', '')),
  ALTER COLUMN "name" SET DEFAULT '';
ALTER TABLE "dc_characteristics"
  ADD COLUMN "description" TEXT;
ALTER TABLE "dc_characteristics"
  ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
