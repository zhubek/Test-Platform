// Live top-up: upsert the catalog view blocks into an existing database
// without touching anything else. Safe to re-run (matches by block name).
//   npm run db:seed:blocks

import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { CATALOG_VIEW_BLOCKS } from './catalog-blocks.seed-data';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Blocks superseded by the catalog-chain redesign (data now lives in catalogs
// and is referenced by id, so the inline-data list blocks are gone).
const REMOVED_BLOCK_NAMES = ['Profession · University list', 'Profession · College list'];

// The declared prop values double as the block's sample data.
function sampleFromProps(props: { name: string; value: unknown }[]): Prisma.InputJsonValue {
  return Object.fromEntries(props.map((p) => [p.name, p.value])) as Prisma.InputJsonValue;
}

async function main() {
  const removed = await prisma.block.deleteMany({ where: { name: { in: REMOVED_BLOCK_NAMES } } });
  if (removed.count) console.log(`Removed  ${removed.count} superseded block(s)`);

  for (const block of CATALOG_VIEW_BLOCKS) {
    const data = {
      ...block,
      props: block.props as unknown as Prisma.InputJsonValue,
      sampleProps: sampleFromProps(block.props),
    };
    const existing = await prisma.block.findFirst({ where: { name: block.name } });
    if (existing) {
      await prisma.block.update({ where: { id: existing.id }, data });
      console.log(`Updated  ${block.name}`);
    } else {
      await prisma.block.create({ data });
      console.log(`Created  ${block.name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
