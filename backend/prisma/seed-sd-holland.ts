import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const J = (v: unknown) => v as Prisma.InputJsonValue;

const SD = 'cmqayxjew0015ncirx1xas61p'; // School Diagnostics

// Likert options — labels only (the widget hides values); scores 0/1/2/3/5.
const OPTIONS = [
  { text: { en: 'Strongly disagree', ru: 'Совсем не согласен', kk: 'Мүлдем келіспеймін' }, value: 0 },
  { text: { en: 'Disagree',          ru: 'Не согласен',        kk: 'Келіспеймін' },          value: 1 },
  { text: { en: 'Neutral',           ru: 'Нейтрально',         kk: 'Бейтарап' },             value: 2 },
  { text: { en: 'Agree',             ru: 'Согласен',           kk: 'Келісемін' },            value: 3 },
  { text: { en: 'Strongly agree',    ru: 'Полностью согласен', kk: 'Толық келісемін' },      value: 5 },
];

// 4 statements per RIASEC dimension, in order.
const DIMENSIONS: { key: string; prompts: string[] }[] = [
  { key: 'realistic', prompts: [
    'I like to work with tools and machines.',
    'I enjoy building or repairing things.',
    'I would like a job that involves working outdoors with my hands.',
    'I prefer practical, hands-on tasks over abstract ideas.' ] },
  { key: 'investigative', prompts: [
    'I enjoy solving complex problems.',
    'I like to analyze data and find patterns.',
    'I am curious about how things work scientifically.',
    'I enjoy doing research and experiments.' ] },
  { key: 'artistic', prompts: [
    'I like to express myself creatively.',
    'I enjoy art, music, or writing.',
    'I prefer tasks that have no single right answer.',
    'I like to design or create new things.' ] },
  { key: 'social', prompts: [
    'I enjoy helping and teaching others.',
    'I like working with people more than with things.',
    'I genuinely care about other people’s wellbeing.',
    'I would enjoy a job that involves counseling or caring for others.' ] },
  { key: 'enterprising', prompts: [
    'I like to lead and persuade people.',
    'I enjoy starting projects and selling ideas.',
    'I am comfortable making decisions for a group.',
    'I would enjoy running my own business.' ] },
  { key: 'conventional', prompts: [
    'I like to organize information and keep records.',
    'I enjoy working with numbers and details.',
    'I prefer clear rules and well-structured tasks.',
    'I am good at following procedures carefully.' ] },
];

async function main() {
  // 1) The Likert question block (label-only scale-choice widget), in School Diagnostics.
  const html =
    '<div class="rounded-2xl border bg-white p-6 shadow-sm">\n' +
    '  <h3 class="text-lg font-semibold text-gray-900">{{prompt}}</h3>\n' +
    '  <div class="mt-5"><widget name="scale-choice" data-field="{{field}}" data-source="options"></widget></div>\n' +
    '</div>';
  const props = [
    { name: 'prompt', type: 'text', value: { en: 'Statement' } },
    { name: 'field', type: 'text', value: 'q1' },
    { name: 'options', type: 'json', value: OPTIONS },
  ];
  await prisma.block.deleteMany({ where: { name: 'Likert scale question', projectId: SD } });
  const block = await prisma.block.create({
    data: {
      type: 'TEST', name: 'Likert scale question', projectId: SD,
      description: 'Agree–disagree statement; options show labels only, each carries a hidden score.',
      html, props: J(props), sampleProps: J(Object.fromEntries(props.map(p => [p.name, p.value]))),
    },
  });

  // 2) The test, with RIASEC vars + match config (professions, top 10).
  const vars = DIMENSIONS.map(d => ({ name: d.key, initial: '0' }));
  const calc: any[] = [
    { name: 'total', expr: DIMENSIONS.map(d => d.key).join(' + ') },
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `cv-top${i + 1}`, name: `top${i + 1}`, expr: '', rank: i + 1, derived: 'match', matchId: 'm-sd-prof',
    })),
  ];
  const matches = [{
    id: 'm-sd-prof', catalogId: 'sdProfessions', catalogLabel: 'Professions',
    groupId: 'dc-cg-riasec', groupName: 'Interests (RIASEC)', method: 'cosine', topN: 10, prefix: 'top',
  }];
  const advancedParams = { vars, calc, matches };

  await prisma.test.deleteMany({ where: { projectId: SD, name: { path: ['en'], equals: 'Career Interests (RIASEC)' } } as any });
  const test = await prisma.test.create({
    data: {
      projectId: SD,
      name: J({ en: 'Career Interests (RIASEC)', ru: 'Профессиональные интересы (RIASEC)', kk: 'Кәсіби қызығушылықтар (RIASEC)' }),
      category: J({ en: 'Career guidance', ru: 'Профориентация', kk: 'Кәсіптік бағдар' }),
      state: 'PUBLISHED',
      info: J({ color: '#4f46e5', icon: 'compass', duration: 10,
        description: { en: 'Discover your Holland (RIASEC) interest profile and the professions that fit it.' } }),
      advancedParams: J(advancedParams),
    },
  });

  // 3) 24 question instances (4 per dimension), with scoring ops.
  let order = 0;
  const blocks: Prisma.TestBlockCreateManyInput[] = [];
  for (const d of DIMENSIONS) {
    d.prompts.forEach((prompt, i) => {
      order += 1;
      const field = `q${order}`;
      blocks.push({
        testId: test.id, blockId: block.id, surface: 'QUESTION', order,
        props: J({ field, prompt: { en: prompt }, options: OPTIONS }),
        advancedParams: J({ onAnswer: [{ expr: `${d.key} + answer`, target: d.key }] }),
      });
    });
  }
  await prisma.testBlock.createMany({ data: blocks });

  console.log(`Created test ${test.id} (${(await prisma.testBlock.count({ where: { testId: test.id } }))} questions), block ${block.id}.`);
  await prisma.$disconnect();
}
main();
