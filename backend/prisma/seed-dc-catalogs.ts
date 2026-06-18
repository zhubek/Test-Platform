// Ports the frontend's mock catalog data into the dc_ tables: the six built-in
// catalog groups with their extra-variable slots, demo items (relations in
// `params`, mapped to real dc ids), and default page templates composed from
// uc_blocks. Also rewires the catalog blocks' sample refs to point at the
// seeded dc items.
//
// Idempotent: groups are upserted by name; each run wipes and recreates the
// groups' items and pages. Run AFTER db:seed:blocks:
//   npm run db:seed:dc

import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const json = (v: unknown) => v as Prisma.InputJsonValue;
const L = (en: string, ru = '', kk = '') => ({ en, ru, kk });

// ── Group definitions: slots + display label ────────────────────────────────
const GROUPS: { name: string; label: string; slots: string[] }[] = [
  { name: 'professions', label: 'Professions', slots: ['salary', 'demand', 'outlook', 'summary'] },
  { name: 'univerPrograms', label: 'University programs', slots: ['minScore', 'tuition', 'summary'] },
  { name: 'collegePrograms', label: 'College programs', slots: ['duration', 'tuition', 'summary'] },
  { name: 'universities', label: 'Universities', slots: ['ranking', 'tuition', 'summary'] },
  { name: 'colleges', label: 'Colleges', slots: ['ranking', 'tuition', 'summary'] },
  { name: 'cities', label: 'Cities', slots: ['population', 'summary'] },
];

// Default page templates per group: page title + block names (from uc_blocks).
const DEFAULT_PAGES: Record<string, { title: object; blocks: string[] }[]> = {
  professions: [
    { title: L('Description', 'Описание', 'Сипаттама'), blocks: ['Profession · Description'] },
    { title: L('Characteristics', 'Характеристики', 'Сипаттамалар'), blocks: ['Profession · Characteristics'] },
    { title: L('Education', 'Образование', 'Білім'), blocks: ['Profession · Education'] },
    { title: L('Labor market', 'Рынок труда', 'Еңбек нарығы'), blocks: ['Profession · Labor market'] },
    { title: L('Content', 'Контент', 'Контент'), blocks: ['Profession · Content'] },
    { title: L('Card', 'Карточка', 'Карточка'), blocks: ['Profession · Card'] },
  ],
  univerPrograms: [{ title: L('Program', 'Программа', 'Бағдарлама'), blocks: ['University programs'] }],
  collegePrograms: [{ title: L('Program', 'Программа', 'Бағдарлама'), blocks: ['College programs'] }],
  universities: [{ title: L('Card', 'Карточка', 'Карточка'), blocks: ['University cards'] }],
  colleges: [{ title: L('Card', 'Карточка', 'Карточка'), blocks: ['College cards'] }],
};

async function main() {
  // ── Groups + slots ─────────────────────────────────────────────────────
  const groupId: Record<string, string> = {};
  for (const g of GROUPS) {
    const existing = await prisma.dataCatalogGroup.findUnique({ where: { name: g.name } });
    const row = existing
      ? await prisma.dataCatalogGroup.update({
          where: { id: existing.id },
          data: { info: json({ label: g.label, builtIn: true }) },
        })
      : await prisma.dataCatalogGroup.create({
          data: { name: g.name, info: json({ label: g.label, builtIn: true }) },
        });
    groupId[g.name] = row.id;
    // Sync slots by varName (keeps ids/values when names persist).
    await prisma.extraVariable.deleteMany({
      where: { groupId: row.id, varName: { notIn: g.slots } },
    });
    for (const [i, varName] of g.slots.entries()) {
      await prisma.extraVariable.upsert({
        where: { groupId_varName: { groupId: row.id, varName } },
        update: { order: i },
        create: { groupId: row.id, varName, order: i },
      });
    }
  }

  // ── Characteristic groups (reusable numeric dimension sets) ─────────────
  // Deterministic ids so attachments + item values survive reseeds.
  const CHAR_GROUPS: { slug: string; name: string; color: string; chars: string[] }[] = [
    { slug: 'riasec', name: 'Interests (RIASEC)', color: '#0d9488',
      chars: ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional'] },
    { slug: 'skills', name: 'Skills', color: '#6366f1',
      chars: ['Communication', 'Analytical', 'Technical', 'Leadership', 'Creativity'] },
    { slug: 'big-five', name: 'Big Five', color: '#ea580c',
      chars: ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'] },
  ];
  const charId: Record<string, string> = {}; // "groupSlug/CharName" → char id
  for (const cg of CHAR_GROUPS) {
    const cgId = `dc-cg-${cg.slug}`;
    await prisma.characteristicGroup.upsert({
      where: { id: cgId },
      update: { name: cg.name, color: cg.color },
      create: { id: cgId, name: cg.name, color: cg.color },
    });
    for (const [i, name] of cg.chars.entries()) {
      const cid = `dc-ch-${cg.slug}-${name.toLowerCase()}`;
      charId[`${cg.slug}/${name}`] = cid;
      await prisma.characteristic.upsert({
        where: { id: cid },
        update: { name, order: i },
        create: { id: cid, groupId: cgId, name, order: i },
      });
    }
    // Attach every characteristic group to professions by default.
    await prisma.dcGroupCharacteristicGroup.upsert({
      where: { catalogGroupId_characteristicGroupId: { catalogGroupId: groupId.professions, characteristicGroupId: cgId } },
      update: {},
      create: { catalogGroupId: groupId.professions, characteristicGroupId: cgId },
    });
  }

  // ── Items (wipe + recreate, dependency order, id-mapped relations) ──────
  for (const g of GROUPS) {
    await prisma.dataCatalog.deleteMany({ where: { groupId: groupId[g.name] } });
  }

  // Deterministic ids (group + slugified English title) so reseeds keep the
  // same ids — open tabs / links survive a `db:seed:dc` re-run.
  const slug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const item = async (group: string, title: { en: string }, desc: object | null, params: object | null) => {
    const id = `dc-${group}-${slug(title.en)}`;
    await prisma.dataCatalog.create({
      data: {
        id,
        groupId: groupId[group],
        title: json(title),
        description: desc !== null ? json(desc) : undefined,
        params: params !== null ? json(params) : undefined,
      },
    });
    return id;
  };

  // Cities
  const almaty = await item('cities', L('Almaty', 'Алматы', 'Алматы'), null, null);
  const astana = await item('cities', L('Astana', 'Астана', 'Астана'), null, null);
  await item('cities', L('Shymkent', 'Шымкент', 'Шымкент'), null, null);
  await item('cities', L('Karaganda', 'Караганда', 'Қарағанды'), null, null);

  // Universities (params: cityId → dc city id, type, contacts)
  const nu = await item('universities', L('Nazarbayev University', 'Назарбаев Университет', 'Назарбаев Университеті'), null, {
    cityId: astana, type: 'public', website: 'https://nu.edu.kz', email: 'info@nu.edu.kz', phone: '+7 7172 70 66 88',
    address: L('53 Kabanbay Batyr Ave, Astana 010000'),
  });
  const kaznu = await item('universities', L('al-Farabi KazNU', 'КазНУ им. аль-Фараби', 'әл-Фараби ат. ҚазҰУ'), null, {
    cityId: almaty, type: 'public', website: 'https://kaznu.kz',
  });
  const kbtu = await item('universities', L('KBTU', 'КБТУ', 'ҚБТУ'), null, {
    cityId: almaty, type: 'private', website: 'https://kbtu.kz',
  });
  await item('universities', L('KIMEP University', 'Университет КИМЭП', 'КИМЭП Университеті'), null, {
    cityId: almaty, type: 'private',
  });

  // Colleges
  const almatyIt = await item('colleges', L('Almaty IT College', 'Алматинский IT-колледж', 'Алматы IT колледжі'), null, {
    cityId: almaty, type: 'public', website: 'https://aitc.kz',
  });
  const astanaMed = await item('colleges', L('Astana Medical College', 'Астанинский медколледж', 'Астана медколледжі'), null, {
    cityId: astana, type: 'public',
  });

  // University programs (params: code, subjects, points, universities links)
  const cs = await item('univerPrograms', L('Computer Science', 'Информатика', 'Информатика'), null, {
    code: '6B06103',
    subjects: L('Math, Physics', 'Математика, Физика', 'Математика, Физика'),
    points: { general: [120, 124, 128, 130, 133], aul: [108, 112, 115, 118, 120], serpin: [100, 103, 106, 108, 110] },
    universities: [{ id: nu, grant: true }, { id: kbtu, grant: false }],
  });
  const medicine = await item('univerPrograms', L('General Medicine', 'Общая медицина', 'Жалпы медицина'), null, {
    code: '6B10101',
    subjects: L('Biology, Chemistry', 'Биология, Химия', 'Биология, Химия'),
    universities: [{ id: kaznu, grant: true }],
  });
  const economics = await item('univerPrograms', L('Economics', 'Экономика', 'Экономика'), null, {
    code: '6B04101',
    subjects: L('Math, Geography', 'Математика, География', 'Математика, География'),
    universities: [],
  });

  // College programs (params: code, colleges links with duration)
  const softwareDev = await item('collegePrograms', L('Software Development', 'Разработка ПО', 'БҚ әзірлеу'), null, {
    code: '06120100',
    colleges: [{ id: almatyIt, duration: L('2 years 10 months', '2 года 10 месяцев', '2 жыл 10 ай') }],
  });
  await item('collegePrograms', L('Nursing', 'Сестринское дело', 'Мейіргер ісі'), null, {
    code: '09110100',
    colleges: [{ id: astanaMed, duration: L('3 years 10 months', '3 года 10 месяцев', '3 жыл 10 ай') }],
  });

  // Professions (params: legacy identity fields + education relations)
  const ds = await item('professions', L('Data Scientist', 'Дата-сайентист'), L('Analyze complex data to drive business decisions', 'Анализ сложных данных для принятия бизнес-решений'), {
    code: 'DS-401', group: 'Technology', complexity: 'high', popular: true,
    education: { specializations: [cs, economics], collegeSpecs: [softwareDev] },
  });
  const nurse = await item('professions', L('Registered Nurse', 'Медсестра/медбрат'), L('Provide patient care and coordinate treatments', 'Уход за пациентами и координация лечения'), {
    code: 'HC-201', group: 'Healthcare', complexity: 'medium', popular: true,
    education: { specializations: [medicine], collegeSpecs: [] },
  });
  const teacher = await item('professions', L('High School Teacher', 'Учитель старших классов'), L('Educate and inspire students in subject areas', 'Обучение и вдохновение учеников по предметам'), { code: 'ED-105', group: 'Education', complexity: 'medium', popular: false });
  const marketing = await item('professions', L('Marketing Manager', 'Менеджер по маркетингу'), L('Plan and execute marketing strategies for growth', 'Планирование и реализация маркетинговых стратегий роста'), { code: 'BU-302', group: 'Business', complexity: 'medium', popular: true });
  const designer = await item('professions', L('Graphic Designer', 'Графический дизайнер'), L('Create visual content for brands and media', 'Создание визуального контента для брендов и медиа'), { code: 'CA-110', group: 'Creative Arts', complexity: 'low', popular: false });
  const biomed = await item('professions', L('Biomedical Researcher', 'Биомедицинский исследователь'), L('Conduct research to advance medical knowledge', 'Проведение исследований для развития медицинских знаний'), { code: 'SC-501', group: 'Science', complexity: 'high', popular: false });
  const swe = await item('professions', L('Software Engineer', 'Инженер-программист'), L('Design and build software applications and systems', 'Проектирование и создание программных приложений и систем'), { code: 'DS-402', group: 'Technology', complexity: 'high', popular: true });

  // ── Default page templates (wipe + recreate, blocks matched by name) ────
  const blocks = await prisma.block.findMany({ select: { id: true, name: true } });
  const blockByName = new Map(blocks.map((b) => [b.name, b.id]));
  for (const [group, pages] of Object.entries(DEFAULT_PAGES)) {
    await prisma.dataCatalogGroupPage.deleteMany({ where: { groupId: groupId[group] } });
    for (const [i, p] of pages.entries()) {
      const blockIds = p.blocks.map((n) => blockByName.get(n)).filter((x): x is string => !!x);
      await prisma.dataCatalogGroupPage.create({
        data: {
          groupId: groupId[group],
          pageName: json(p.title),
          order: i,
          blocks: { create: blockIds.map((blockId, j) => ({ blockId, order: j, props: json({}) })) },
        },
      });
    }
  }

  // ── Per-item page props: each profession fills its pages with its data ──
  // Look up the first block instance of each profession page by page title.
  const profPages = await prisma.dataCatalogGroupPage.findMany({
    where: { groupId: groupId.professions },
    include: { blocks: { orderBy: { order: 'asc' } } },
  });
  const pageBlock: Record<string, string> = {};
  for (const p of profPages) {
    const en = (p.pageName as { en?: string }).en ?? '';
    if (p.blocks[0]) pageBlock[en] = p.blocks[0].id;
  }

  const setProps = async (catalogId: string, pageEn: string, props: object) => {
    const pageBlockId = pageBlock[pageEn];
    if (!pageBlockId) return;
    await prisma.dataCatalogPageProp.create({
      data: { catalogId, pageBlockId, props: json(props) },
    });
  };

  // Card props for every profession (the /explore card look).
  const GROUP_CLASSES: Record<string, { badge: string; tile: string }> = {
    Technology: { badge: 'bg-blue-100 text-blue-800', tile: 'bg-blue-50 text-blue-600' },
    Healthcare: { badge: 'bg-emerald-100 text-emerald-800', tile: 'bg-emerald-50 text-emerald-600' },
    Education: { badge: 'bg-amber-100 text-amber-800', tile: 'bg-amber-50 text-amber-600' },
    Business: { badge: 'bg-violet-100 text-violet-800', tile: 'bg-violet-50 text-violet-600' },
    'Creative Arts': { badge: 'bg-pink-100 text-pink-800', tile: 'bg-pink-50 text-pink-600' },
    Science: { badge: 'bg-sky-100 text-sky-800', tile: 'bg-sky-50 text-sky-600' },
  };
  const CARDS: [string, string, string, string, string, string, boolean, number][] = [
    // [itemId, title, code, desc, group, icon, popular, prepLevel]
    [ds, 'Data Scientist', 'DS-401', 'Analyze complex data to drive business decisions', 'Technology', '📊', true, 5],
    [nurse, 'Registered Nurse', 'HC-201', 'Provide patient care and coordinate treatments', 'Healthcare', '🩺', true, 4],
    [teacher, 'High School Teacher', 'ED-105', 'Educate and inspire students in subject areas', 'Education', '📚', false, 3],
    [marketing, 'Marketing Manager', 'BU-302', 'Plan and execute marketing strategies for growth', 'Business', '📈', true, 3],
    [designer, 'Graphic Designer', 'CA-110', 'Create visual content for brands and media', 'Creative Arts', '🎨', false, 2],
    [biomed, 'Biomedical Researcher', 'SC-501', 'Conduct research to advance medical knowledge', 'Science', '🔬', false, 5],
    [swe, 'Software Engineer', 'DS-402', 'Design and build software applications and systems', 'Technology', '💻', true, 4],
  ];
  for (const [itemId, title, code, desc, group, icon, popular, prepLevel] of CARDS) {
    const cls = GROUP_CLASSES[group];
    await setProps(itemId, 'Card', {
      title, code, desc, group, icon, popular, prepLevel,
      groupBadgeClass: cls.badge, groupTileClass: cls.tile,
    });
  }

  // Education refs per item (the relations live on the item's params too).
  await setProps(ds, 'Education', {
    universityPrograms: { $catalog: 'univerPrograms', ids: [cs, economics] },
    collegePrograms: { $catalog: 'collegePrograms', ids: [softwareDev] },
  });
  await setProps(nurse, 'Education', {
    universityPrograms: { $catalog: 'univerPrograms', ids: [medicine] },
    collegePrograms: { $catalog: 'collegePrograms', ids: [] },
  });

  // Data Scientist gets the fully populated Characteristics + Content pages
  // (the only profession with detail mock data; others fall back to samples).
  await setProps(ds, 'Characteristics', {
    interests: [
      { name: 'Investigative', level: 90, desc: 'Strong match with analytical research work' },
      { name: 'Conventional', level: 65, desc: 'Working with structured data and systems' },
      { name: 'Realistic', level: 55, desc: 'Hands-on technical implementation' },
      { name: 'Artistic', level: 30, desc: 'Some creative visualization work' },
      { name: 'Social', level: 25, desc: 'Limited direct social interaction' },
      { name: 'Enterprising', level: 20, desc: 'Not primarily leadership-focused' },
    ],
    personality: [
      { name: 'Openness', level: 88, desc: 'Curiosity drives exploration of data' },
      { name: 'Conscientiousness', level: 85, desc: 'Attention to detail is essential' },
      { name: 'Extraversion', level: 50, desc: 'Collaborative but also independent' },
      { name: 'Agreeableness', level: 55, desc: 'Team-oriented communication' },
      { name: 'Neuroticism', level: 25, desc: 'Calm under pressure with deadlines' },
    ],
    skills: [
      { name: 'Analytical', level: 92, desc: 'Core skill for data interpretation' },
      { name: 'Technical', level: 85, desc: 'Programming and tool proficiency' },
      { name: 'Communication', level: 60, desc: 'Presenting findings to stakeholders' },
      { name: 'Leadership', level: 30, desc: 'Not a primary requirement' },
    ],
    values: [
      { name: 'Autonomy', level: 85, desc: 'Independent problem-solving' },
      { name: 'Creativity', level: 82, desc: 'Novel approaches to data problems' },
      { name: 'Financial Security', level: 80, desc: 'Competitive compensation' },
      { name: 'Work-Life Balance', level: 60, desc: 'Generally flexible, some crunch' },
      { name: 'Social Impact', level: 50, desc: 'Depends on industry and project' },
    ],
  });
  await setProps(ds, 'Content', {
    videos: [
      { title: 'What is Data Science?', description: 'A practical introduction to what data scientists actually do day to day.', youtubeUrl: 'https://www.youtube.com/watch?v=X3paOmcrTjQ', ytId: 'X3paOmcrTjQ' },
      { title: 'A Day in the Life of a Data Scientist', description: 'Follow a working data scientist through a typical project week.', youtubeUrl: 'https://www.youtube.com/watch?v=xC-c7E5PK0Y', ytId: 'xC-c7E5PK0Y' },
    ],
  });

  // ── Data Scientist characteristic values (from the mock) ────────────────
  const DS_CHARS: Record<string, number> = {
    'riasec/Investigative': 90, 'riasec/Conventional': 65, 'riasec/Realistic': 55,
    'riasec/Artistic': 30, 'riasec/Social': 25, 'riasec/Enterprising': 20,
    'skills/Analytical': 92, 'skills/Technical': 85, 'skills/Communication': 60, 'skills/Leadership': 30,
    'big-five/Openness': 88, 'big-five/Conscientiousness': 85, 'big-five/Extraversion': 50,
    'big-five/Agreeableness': 55, 'big-five/Neuroticism': 25,
  };
  for (const [key, value] of Object.entries(DS_CHARS)) {
    const characteristicId = charId[key];
    if (characteristicId) {
      await prisma.dataCatalogCharacteristicValue.create({
        data: { catalogId: ds, characteristicId, value },
      });
    }
  }

  // ── Rewire catalog blocks' sample refs to the seeded dc item ids ────────
  const SAMPLE_REFS: Record<string, Record<string, { $catalog: string; ids: string[] }>> = {
    'University cards': { universities: { $catalog: 'universities', ids: [nu, kaznu, kbtu] } },
    'University programs': { programs: { $catalog: 'univerPrograms', ids: [cs, medicine] } },
    'College cards': { colleges: { $catalog: 'colleges', ids: [almatyIt, astanaMed] } },
    'College programs': { programs: { $catalog: 'collegePrograms', ids: [softwareDev] } },
    'Profession · Education': {
      universityPrograms: { $catalog: 'univerPrograms', ids: [cs, economics] },
      collegePrograms: { $catalog: 'collegePrograms', ids: [softwareDev] },
    },
  };
  for (const [blockName, refs] of Object.entries(SAMPLE_REFS)) {
    const block = await prisma.block.findFirst({ where: { name: blockName } });
    if (!block) continue;
    const props = (block.props as { name: string; type: string; value: unknown }[]).map((p) =>
      refs[p.name] ? { ...p, value: refs[p.name] } : p,
    );
    const sampleProps = { ...(block.sampleProps as Record<string, unknown>), ...refs };
    await prisma.block.update({
      where: { id: block.id },
      data: { props: json(props), sampleProps: json(sampleProps) },
    });
  }

  console.log(`Seeded ${GROUPS.length} dc catalog groups with items, slots, default pages; rewired block sample refs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
