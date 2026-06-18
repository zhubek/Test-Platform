/**
 * Demo data localization for the i18n test-question pipeline: convert the
 * Holland (RIASEC) test's name, prompts, and options from plain English strings
 * to Localized { en, ru, kk } maps. Idempotent.
 *
 *   cd backend && npx ts-node prisma/localize-holland.ts
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const NAME = {
  en: 'Holland Career Test (RIASEC)',
  ru: 'Профориентационный тест Холланда (RIASEC)',
  kk: 'Холландтың кәсіптік бағдар тесті (RIASEC)',
};

const PROMPTS: Record<string, { en: string; ru: string; kk: string }> = {
  q1: { en: 'I enjoy building or repairing things with my hands.', ru: 'Мне нравится создавать или ремонтировать вещи своими руками.', kk: 'Маған заттарды өз қолыммен жасау немесе жөндеу ұнайды.' },
  q2: { en: 'I like working with tools, machines, or outdoors.', ru: 'Мне нравится работать с инструментами, машинами или на открытом воздухе.', kk: 'Маған құралдармен, машиналармен немесе ашық ауада жұмыс істеу ұнайды.' },
  q3: { en: 'I like solving puzzles and analyzing data.', ru: 'Мне нравится решать головоломки и анализировать данные.', kk: 'Маған басқатырғыштарды шешу және деректерді талдау ұнайды.' },
  q4: { en: 'I enjoy researching how and why things work.', ru: 'Мне нравится исследовать, как и почему всё работает.', kk: 'Маған заттардың қалай және неге жұмыс істейтінін зерттеу ұнайды.' },
  q5: { en: 'I like drawing, writing, music, or design.', ru: 'Мне нравится рисование, письмо, музыка или дизайн.', kk: 'Маған сурет салу, жазу, музыка немесе дизайн ұнайды.' },
  q6: { en: 'I enjoy coming up with original, creative ideas.', ru: 'Мне нравится придумывать оригинальные, творческие идеи.', kk: 'Маған тың, шығармашыл идеялар ойлап табу ұнайды.' },
  q7: { en: 'I like helping and teaching other people.', ru: 'Мне нравится помогать и обучать других людей.', kk: 'Маған басқа адамдарға көмектесу және оларды оқыту ұнайды.' },
  q8: { en: 'I enjoy working in teams and supporting others.', ru: 'Мне нравится работать в команде и поддерживать других.', kk: 'Маған командада жұмыс істеп, басқаларды қолдау ұнайды.' },
  q9: { en: 'I like leading people and persuading them.', ru: 'Мне нравится вести за собой людей и убеждать их.', kk: 'Маған адамдарды бастап, оларды сендіру ұнайды.' },
  q10: { en: 'I enjoy starting projects and taking charge.', ru: 'Мне нравится начинать проекты и брать на себя ответственность.', kk: 'Маған жобаларды бастау және жауапкершілікті өз мойныма алу ұнайды.' },
  q11: { en: 'I like organizing information and following clear steps.', ru: 'Мне нравится упорядочивать информацию и следовать чётким шагам.', kk: 'Маған ақпаратты реттеу және нақты қадамдарды орындау ұнайды.' },
  q12: { en: 'I enjoy working with numbers, records, and detail.', ru: 'Мне нравится работать с числами, записями и деталями.', kk: 'Маған сандармен, жазбалармен және егжей-тегжейлермен жұмыс істеу ұнайды.' },
};

const OPTIONS: Record<string, { en: string; ru: string; kk: string }> = {
  Disagree: { en: 'Disagree', ru: 'Не согласен', kk: 'Келіспеймін' },
  Neutral: { en: 'Neutral', ru: 'Нейтрально', kk: 'Бейтарап' },
  Agree: { en: 'Agree', ru: 'Согласен', kk: 'Келісемін' },
};

// read either a plain string or an existing { en, ... } map
const enOf = (v: unknown): string => (typeof v === 'string' ? v : (v as { en?: string })?.en ?? '');

async function main() {
  const nameRes = await prisma.$executeRawUnsafe(
    `UPDATE test_tests SET name = $1::jsonb WHERE name->>'en' = $2`,
    JSON.stringify(NAME),
    NAME.en,
  );
  console.log(`test name localized: ${nameRes} row(s)`);

  const blocks: { id: string; props: any }[] = await prisma.$queryRawUnsafe(
    `SELECT id, props FROM test_blocks WHERE surface='QUESTION'`,
  );
  let updated = 0;
  for (const b of blocks) {
    const p = { ...b.props };
    const field = p.field as string;
    if (PROMPTS[field]) p.prompt = PROMPTS[field];
    if (Array.isArray(p.options)) {
      p.options = p.options.map((o: any) => {
        const key = enOf(o.text);
        return OPTIONS[key] ? { ...o, text: OPTIONS[key] } : o;
      });
    }
    await prisma.$executeRawUnsafe(`UPDATE test_blocks SET props = $1::jsonb WHERE id = $2`, JSON.stringify(p), b.id);
    updated++;
  }
  console.log(`question blocks localized: ${updated}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
