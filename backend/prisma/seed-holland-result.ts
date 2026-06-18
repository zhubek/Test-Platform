/**
 * Create RESULT view blocks for the Holland (RIASEC) test and attach them to it.
 *
 *   cd backend && npx ts-node prisma/seed-holland-result.ts
 *
 * Idempotent: blocks are upserted by name, and the test's RESULT surface is
 * rebuilt from scratch each run. The chart `data` props bind to the test's six
 * RIASEC variables via the `series(...)` helper (see frontend lib/view-expr.ts).
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { BlockType, PrismaClient, TestSurface } from '@prisma/client';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TEST_ID = 'cmqbvml5t00040sir95grhyx9';

// Sample profile used for library thumbnails and the editor preview.
const SAMPLE = [
  { name: 'Realistic', value: 72 },
  { name: 'Investigative', value: 65 },
  { name: 'Artistic', value: 48 },
  { name: 'Social', value: 81 },
  { name: 'Enterprising', value: 57 },
  { name: 'Conventional', value: 40 },
];

// Binds the chart data to the test's six RIASEC variables as a STATIC collection
// where each cell carries an inline {{variable}} (resolved to its number at
// render). This is the Static form the Result editor expects — not an expression.
const RIASEC_CELLS = [
  { name: 'Realistic', value: '{{realistic}}' },
  { name: 'Investigative', value: '{{investigative}}' },
  { name: 'Artistic', value: '{{artistic}}' },
  { name: 'Social', value: '{{social}}' },
  { name: 'Enterprising', value: '{{enterprising}}' },
  { name: 'Conventional', value: '{{conventional}}' },
];

type Prop = { name: string; type: string; value: unknown };
type SeedBlock = { name: string; description: string; html: string; props: Prop[] };

const BLOCKS: SeedBlock[] = [
  {
    name: 'Holland — top interest',
    description: 'Highlights the strongest RIASEC type from the result variables.',
    html: `<div class="rounded-2xl border bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
  <p class="text-xs font-semibold uppercase tracking-wider text-indigo-500">{{title}}</p>
  <p class="mt-1 text-3xl font-extrabold text-gray-900">{{ top(data).name }}</p>
  <p class="mt-2 text-sm text-gray-600">{{blurb}}</p>
</div>`,
    props: [
      { name: 'title', type: 'text', value: 'Your strongest interest' },
      { name: 'blurb', type: 'text', value: 'Based on your answers, this Holland type fits you best. The careers we suggest match it.' },
      { name: 'data', type: 'json', value: SAMPLE },
    ],
  },
  {
    name: 'Holland — RIASEC radar (net diagram)',
    description: 'Radar / net diagram over the six Holland interest axes.',
    html: `<div class="rounded-2xl border bg-white p-5 shadow-sm">
  <h3 class="mb-2 text-base font-bold text-gray-900">{{title}}</h3>
  <widget name="radar-chart" data-source="data" data-subject-key="name" data-value-key="value" data-color="{{color}}" class="h-80"></widget>
</div>`,
    props: [
      { name: 'title', type: 'text', value: 'Your interest profile' },
      { name: 'color', type: 'color', value: '#4f46e5' },
      { name: 'data', type: 'json', value: SAMPLE },
    ],
  },
  {
    name: 'Holland — RIASEC score bars',
    description: 'Bar chart of the six Holland interest scores.',
    html: `<div class="rounded-2xl border bg-white p-5 shadow-sm">
  <h3 class="mb-3 text-base font-bold text-gray-900">{{title}}</h3>
  <widget name="bar-chart" data-source="data" data-x="name" data-y="value" data-color="{{color}}" class="h-72"></widget>
</div>`,
    props: [
      { name: 'title', type: 'text', value: 'Scores by interest type' },
      { name: 'color', type: 'color', value: '#0d9488' },
      { name: 'data', type: 'json', value: SAMPLE },
    ],
  },
];

// Per-block instance props as attached to the test: every prop carries a value
// (static defaults), with `data` bound to the live RIASEC variables.
function instanceProps(b: SeedBlock): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const p of b.props) props[p.name] = p.value;
  props.data = RIASEC_CELLS;
  return props;
}

function sampleProps(b: SeedBlock): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const p of b.props) o[p.name] = p.value;
  return o;
}

async function main() {
  const test = await prisma.test.findUnique({ where: { id: TEST_ID } });
  if (!test) throw new Error(`Test ${TEST_ID} not found`);

  // 1) Upsert the library blocks (no unique on name, so find-or-create by name).
  const ids: string[] = [];
  for (const b of BLOCKS) {
    const existing = await prisma.block.findFirst({ where: { name: b.name, type: BlockType.RESULT } });
    const payload = {
      type: BlockType.RESULT,
      name: b.name,
      description: b.description,
      html: b.html,
      props: b.props as object,
      sampleProps: sampleProps(b) as object,
    };
    const saved = existing
      ? await prisma.block.update({ where: { id: existing.id }, data: payload })
      : await prisma.block.create({ data: payload });
    ids.push(saved.id);
    console.log(`${existing ? 'updated' : 'created'} block: ${saved.name} (${saved.id})`);
  }

  // 2) Rebuild the test's RESULT surface from these blocks, in order.
  await prisma.testBlock.deleteMany({ where: { testId: TEST_ID, surface: TestSurface.RESULT } });
  for (let i = 0; i < BLOCKS.length; i++) {
    await prisma.testBlock.create({
      data: {
        testId: TEST_ID,
        blockId: ids[i],
        surface: TestSurface.RESULT,
        order: i,
        props: instanceProps(BLOCKS[i]) as object,
      },
    });
    console.log(`attached [${i}] ${BLOCKS[i].name}`);
  }

  console.log('\nDone. RESULT page wired to RIASEC variables.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
