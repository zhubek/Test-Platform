/**
 * One-off data migration for the i18n rework (docs/i18n-rework.md §8 step 3):
 * rename the Localized JSON key `kz` → `kk` in every stored value, plus the
 * `core_languages` row. Idempotent — safe to run more than once.
 *
 * Renames object KEYS named exactly "kz" at any depth (handles nested PropValue
 * maps). Values are never touched, so `.kz` domain strings (nu.edu.kz, …) are
 * left alone.
 *
 *   cd backend && npx ts-node prisma/migrate-kz-to-kk.ts
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION rename_kz_kk(data jsonb) RETURNS jsonb AS $fn$
    DECLARE result jsonb; k text; v jsonb;
    BEGIN
      IF data IS NULL THEN RETURN NULL; END IF;
      CASE jsonb_typeof(data)
        WHEN 'object' THEN
          result := '{}'::jsonb;
          FOR k, v IN SELECT key, value FROM jsonb_each(data) LOOP
            result := result || jsonb_build_object(
              CASE WHEN k = 'kz' THEN 'kk' ELSE k END, rename_kz_kk(v));
          END LOOP;
          RETURN result;
        WHEN 'array' THEN
          RETURN (SELECT coalesce(jsonb_agg(rename_kz_kk(e)), '[]'::jsonb)
                  FROM jsonb_array_elements(data) e);
        ELSE RETURN data;
      END CASE;
    END;
    $fn$ LANGUAGE plpgsql;
  `);

  const cols = await prisma.$queryRawUnsafe<{ table_name: string; column_name: string }[]>(`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type = 'jsonb'
    ORDER BY table_name, column_name;
  `);

  let updated = 0;
  for (const c of cols) {
    const filter = `"${c.column_name}"::text LIKE '%"kz"%'`;
    const n = await prisma.$executeRawUnsafe(
      `UPDATE "${c.table_name}" SET "${c.column_name}" = rename_kz_kk("${c.column_name}") WHERE ${filter}`,
    );
    if (n > 0) {
      updated += n;
      console.log(`  ${c.table_name}.${c.column_name}: ${n} row(s) kz→kk`);
    }
  }

  const lang = await prisma.$executeRawUnsafe(`UPDATE core_languages SET name = 'kk' WHERE name = 'kz'`);
  console.log(`  core_languages.name: ${lang} row(s) kz→kk`);

  // verify nothing remains
  let remaining = 0;
  for (const c of cols) {
    const r = await prisma.$queryRawUnsafe<{ n: number }[]>(
      `SELECT count(*)::int AS n FROM "${c.table_name}" WHERE "${c.column_name}"::text LIKE '%"kz"%'`,
    );
    remaining += r[0].n;
  }

  await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS rename_kz_kk(jsonb)`);

  console.log(`\nColumns scanned: ${cols.length} | JSONB rows updated: ${updated} | remaining "kz" rows: ${remaining}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
