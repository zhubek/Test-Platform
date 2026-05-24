// In-memory mock API — no backend required.
//
// Every function mirrors a real REST client signature but reads/writes a
// module-level store seeded with sample data. Edits persist for the lifetime
// of the page session (lost on full reload). Swap this file for a fetch-based
// client when a backend exists.

// ── Shared types ────────────────────────────────────────────────────────

export interface Localized {
  en: string;
  ru: string;
  kz: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AnswerRow {
  id: number;
  questionId: number;
  text: Localized;
  vars: any;
  value?: number;
  visibleIf?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionRow {
  id: number;
  text: Localized;
  name?: string;
  sectionId: number;
  order: number;
  type: string;
  rateMax?: number;
  logic?: any;
  answers: AnswerRow[];
  createdAt: string;
  updatedAt: string;
}

export interface SectionRow {
  id: number;
  title: Localized;
  testId: number;
  order: number;
  visibleIf?: string;
  questions: QuestionRow[];
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TestRow {
  id: number;
  name: Localized;
  desc: Localized | null;
  duration: number | null;
  category: string | null;
  color: string | null;
  icon: string | null;
  state: string;
  vars: any;
  calcLogic: any;
  surveyLogic?: any;
  resultViewLogic: any;
  dashboardViewLogic: any;
  sections?: SectionRow[];
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TestInput {
  name?: Localized;
  desc?: Localized;
  duration?: number;
  category?: string;
  color?: string;
  icon?: string;
  state?: string;
  vars?: any;
  calcLogic?: any;
  resultViewLogic?: any;
  dashboardViewLogic?: any;
}

// ── Mock store ──────────────────────────────────────────────────────────

const now = () => new Date().toISOString();
let seq = 1000;
const nextId = () => ++seq;
const delay = <T>(value: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const L = (en: string, ru = en, kz = en): Localized => ({ en, ru, kz });

function seedTest(
  id: number,
  name: Localized,
  desc: Localized,
  state: string,
  color: string,
  sections: SectionRow[] = [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extra: Partial<TestRow> = {},
): TestRow {
  return {
    id,
    name,
    desc,
    duration: 15,
    category: "Personality",
    color,
    icon: "compass",
    state,
    vars: { variables: [] },
    calcLogic: { characteristicSections: [] },
    resultViewLogic: { widgets: [] },
    dashboardViewLogic: { widgets: [] },
    sections,
    createdAt: now(),
    updatedAt: now(),
    ...extra,
  };
}

// Builds a single-choice question with weighted answers.
// weights: array of { text, vars } where vars assigns points to variables.
let qSeq = 100;
let aSeq = 5000;
function seedQuestion(
  sectionId: number,
  text: Localized,
  type: string,
  answers: { text: Localized; vars?: { variableId: string; value: number }[] }[],
  opts: {
    name?: string;
    visibleIf?: string;
    enableIf?: string;
    requiredIf?: string;
    rateMax?: number;
    // per-choice visibleIf, keyed by the choice's 1-based position
    choiceVisibleIf?: Record<number, string>;
  } = {},
): QuestionRow {
  const qid = ++qSeq + 100;
  const logic =
    opts.visibleIf || opts.enableIf || opts.requiredIf
      ? { visibleIf: opts.visibleIf, enableIf: opts.enableIf, requiredIf: opts.requiredIf }
      : undefined;
  return {
    id: qid,
    text,
    name: opts.name,
    sectionId,
    order: 0,
    type,
    rateMax: opts.rateMax,
    logic,
    createdAt: now(),
    updatedAt: now(),
    answers: answers.map((a, i) => ({
      id: ++aSeq,
      questionId: qid,
      text: a.text,
      vars: a.vars ?? [],
      visibleIf: opts.choiceVisibleIf?.[i + 1],
      createdAt: now(),
      updatedAt: now(),
    })),
  };
}

const likertAnswers = (varId: string) => [
  { text: L("Strongly disagree", "Совсем не согласен", "Мүлдем келіспеймін"), vars: [{ variableId: varId, value: 0 }] },
  { text: L("Disagree", "Не согласен", "Келіспеймін"), vars: [{ variableId: varId, value: 1 }] },
  { text: L("Neutral", "Нейтрально", "Бейтарап"), vars: [{ variableId: varId, value: 2 }] },
  { text: L("Agree", "Согласен", "Келісемін"), vars: [{ variableId: varId, value: 3 }] },
  { text: L("Strongly agree", "Полностью согласен", "Толық келісемін"), vars: [{ variableId: varId, value: 5 }] },
];

function section(
  id: number,
  testId: number,
  title: Localized,
  questions: QuestionRow[],
  visibleIf?: string,
): SectionRow {
  questions.forEach((q, i) => {
    q.sectionId = id;
    q.order = i;
    q.answers.forEach((a) => (a.questionId = q.id));
  });
  return { id, title, testId, order: 0, visibleIf, questions, createdAt: now(), updatedAt: now() };
}

// ── Holland (RIASEC) — full weighted test ────────────────────────────────
const hollandVars = [
  { id: "realistic", name: "realistic", description: L("Realistic", "Реалистичный", "Реалистік") },
  { id: "investigative", name: "investigative", description: L("Investigative", "Исследовательский", "Зерттеушілік") },
  { id: "artistic", name: "artistic", description: L("Artistic", "Артистичный", "Көркемдік") },
  { id: "social", name: "social", description: L("Social", "Социальный", "Әлеуметтік") },
  { id: "enterprising", name: "enterprising", description: L("Enterprising", "Предприимчивый", "Кәсіпкерлік") },
  { id: "conventional", name: "conventional", description: L("Conventional", "Традиционный", "Дәстүрлі") },
];

const tests: TestRow[] = [
  seedTest(
    1,
    L("Holland Career Test", "Тест Голланда", "Холланд тесті"),
    L("RIASEC career interest assessment", "Профориентационный тест RIASEC", "RIASEC мансаптық қызығушылық тесті"),
    "published",
    "#0d9488",
    [
      section(11, 1, L("Activities", "Активности", "Әрекеттер"), [
        // q1 — its last option ("Strongly agree" = value 5) is hidden unless q2 = 5.
        seedQuestion(11, L("I like to work on cars and machines", "Мне нравится работать с машинами"), "single",
          likertAnswers("realistic"), { choiceVisibleIf: { 5: "{q2} = 5" } }),
        seedQuestion(11, L("I enjoy solving math or science problems", "Мне нравится решать задачи по науке"), "single",
          likertAnswers("investigative")),
        // q3 — only shows when the respondent answered Agree/Strongly agree to q2.
        seedQuestion(11, L("I like to draw, paint, or write", "Мне нравится рисовать или писать"), "single",
          likertAnswers("artistic"), { visibleIf: "{q2} = 4 or {q2} = 5" }),
      ]),
      // Page-level visibleIf — the whole Preferences page is hidden until q1 is answered.
      section(12, 1, L("Preferences", "Предпочтения", "Қалаулар"), [
        // q4 — disabled (enableIf) until q1 = "Strongly agree" (value 5).
        seedQuestion(12, L("I enjoy helping and teaching others", "Мне нравится помогать другим"), "single",
          likertAnswers("social"), { enableIf: "{q1} = 5" }),
        // q5 — becomes required once q1 is answered.
        seedQuestion(12, L("I like to lead and persuade people", "Мне нравится вести за собой"), "single",
          likertAnswers("enterprising"), { requiredIf: "{q1} notempty" }),
        seedQuestion(12, L("I like to organize and follow procedures", "Мне нравится упорядочивать"), "single",
          likertAnswers("conventional")),
        // Multiple-choice question — usable as a Multiple Choice Variable.
        seedQuestion(12, L("Which subjects interest you?", "Какие предметы вам интересны?", "Қандай пәндер қызықтырады?"), "multiple", [
          { text: L("Mathematics", "Математика", "Математика") },
          { text: L("Art", "Искусство", "Өнер") },
          { text: L("Science", "Наука", "Ғылым") },
          { text: L("Languages", "Языки", "Тілдер") },
        ]),
      ], "{q1} notempty"),
    ],
    {
      icon: "compass",
      duration: 12,
      category: "Career",
      vars: { variables: hollandVars },
      // Survey-level logic demo (evaluated in the preview):
      surveyLogic: {
        calculatedValues: [
          // {engagement} — derived from q2, referenceable in any expression.
          {
            name: "engagement",
            expression: "iif({q2} = 4 or {q2} = 5, 'high', 'low')",
            includeIntoResult: true,
          },
        ],
        triggers: [
          // Auto-complete the survey if q1 is "Strongly disagree" (value 1).
          { type: "complete", expression: "{q1} = 1" },
          // copyvalue: when q2 is "Strongly agree" (value 5), copy it into q6.
          { type: "copyvalue", expression: "{q2} = 5", setToName: "q6", fromName: "q2" },
        ],
        completedHtmlOnCondition: [
          { expression: "{engagement} = 'high'", html: "<b>High engagement</b> — you showed strong interest." },
          { expression: "{engagement} = 'low'", html: "<b>Low engagement</b> — interest was modest." },
        ],
      },
      resultViewLogic: {
        widgets: [
          { id: "w1", componentType: "bar_chart", title: L("Your RIASEC profile", "Ваш профиль RIASEC"), bind: "characteristics" },
          { id: "w2", componentType: "summary_text", title: L("Top interest", "Главный интерес"), bind: "topDimension" },
        ],
      },
    },
  ),
  seedTest(
    2,
    L("Big Five Personality", "Большая пятёрка", "Үлкен бестік"),
    L("OCEAN trait inventory", "Опросник черт личности OCEAN", "OCEAN тұлға қасиеттері"),
    "published",
    "#7c3aed",
    [
      section(21, 2, L("Openness & Conscientiousness", "Открытость и сознательность"), [
        seedQuestion(21, L("I have a vivid imagination", "У меня живое воображение"), "single", likertAnswers("openness")),
        seedQuestion(21, L("I get chores done right away", "Я сразу выполняю задачи"), "single", likertAnswers("conscientiousness")),
      ]),
      section(22, 2, L("Extraversion & Agreeableness", "Экстраверсия и доброжелательность"), [
        seedQuestion(22, L("I feel comfortable around people", "Мне комфортно среди людей"), "single", likertAnswers("extraversion")),
        seedQuestion(22, L("I sympathize with others' feelings", "Я сочувствую другим"), "single", likertAnswers("agreeableness")),
      ]),
    ],
    {
      icon: "fingerprint",
      duration: 10,
      category: "Personality",
      vars: {
        variables: [
          { id: "openness", name: "openness", description: L("Openness", "Открытость") },
          { id: "conscientiousness", name: "conscientiousness", description: L("Conscientiousness", "Сознательность") },
          { id: "extraversion", name: "extraversion", description: L("Extraversion", "Экстраверсия") },
          { id: "agreeableness", name: "agreeableness", description: L("Agreeableness", "Доброжелательность") },
        ],
      },
      resultViewLogic: {
        widgets: [{ id: "w1", componentType: "radar_chart", title: L("Trait profile", "Профиль черт"), bind: "characteristics" }],
      },
    },
  ),
  seedTest(
    3,
    L("Emotional Intelligence", "Эмоциональный интеллект", "Эмоционалды интеллект"),
    L("EQ self-assessment", "Самооценка EQ", "EQ өзін-өзі бағалау"),
    "published",
    "#ea580c",
    [
      section(31, 3, L("Self-awareness", "Самосознание"), [
        seedQuestion(31, L("I recognize my emotions as they happen", "Я осознаю свои эмоции"), "single", likertAnswers("awareness")),
        seedQuestion(31, L("I stay calm under pressure", "Я сохраняю спокойствие под давлением"), "single", likertAnswers("regulation")),
      ]),
    ],
    {
      icon: "heart",
      duration: 8,
      category: "Soft skills",
      vars: {
        variables: [
          { id: "awareness", name: "awareness", description: L("Self-awareness", "Самосознание") },
          { id: "regulation", name: "regulation", description: L("Self-regulation", "Саморегуляция") },
        ],
      },
    },
  ),
  seedTest(
    4,
    L("Learning Styles", "Стили обучения", "Оқу стильдері"),
    L("Discover how you learn best", "Узнайте, как вы учитесь лучше всего", "Қалай жақсы оқитыныңызды біліңіз"),
    "draft",
    "#2563eb",
    [],
    { icon: "book-open", duration: 6, category: "Education" },
  ),
  seedTest(
    5,
    L("Conflict Style", "Стиль разрешения конфликтов", "Қақтығыс стилі"),
    L("How you handle disagreements", "Как вы справляетесь с разногласиями", "Келіспеушіліктерді қалай шешесіз"),
    "draft",
    "#dc2626",
    [],
    { icon: "scale", duration: 9, category: "Soft skills" },
  ),
];

const findTest = (id: number) => tests.find((t) => t.id === id);

// ── Tests ───────────────────────────────────────────────────────────────

export function fetchTests(): Promise<TestRow[]> {
  return delay(clone(tests));
}

export function fetchTest(id: number): Promise<TestRow> {
  const t = findTest(id);
  if (!t) return Promise.reject(new Error(`Test ${id} not found`));
  return delay(clone(t));
}

export function createTest(data: TestInput): Promise<TestRow> {
  const t = seedTest(
    nextId(),
    data.name ?? L(""),
    data.desc ?? L(""),
    data.state ?? "draft",
    data.color ?? "#6b7280",
  );
  Object.assign(t, data, { sections: [] });
  tests.unshift(t);
  return delay(clone(t));
}

export function updateTest(id: number, data: Partial<TestInput>): Promise<TestRow> {
  const t = findTest(id);
  if (!t) return Promise.reject(new Error(`Test ${id} not found`));
  Object.assign(t, data, { updatedAt: now() });
  return delay(clone(t));
}

// ── Sections ────────────────────────────────────────────────────────────

export function createSection(data: {
  title: Localized;
  testId: number;
  order: number;
}): Promise<SectionRow> {
  const t = findTest(data.testId);
  if (!t) return Promise.reject(new Error(`Test ${data.testId} not found`));
  const s: SectionRow = {
    id: nextId(),
    title: data.title,
    testId: data.testId,
    order: data.order,
    questions: [],
    createdAt: now(),
    updatedAt: now(),
  };
  (t.sections ??= []).push(s);
  return delay(clone(s));
}

export function updateSection(
  id: number,
  data: { title?: Localized; order?: number },
): Promise<SectionRow> {
  for (const t of tests) {
    const s = t.sections?.find((x) => x.id === id);
    if (s) {
      Object.assign(s, data, { updatedAt: now() });
      return delay(clone(s));
    }
  }
  return Promise.reject(new Error(`Section ${id} not found`));
}

export function deleteSection(id: number): Promise<void> {
  for (const t of tests) {
    if (t.sections) t.sections = t.sections.filter((x) => x.id !== id);
  }
  return delay(undefined);
}

// ── Questions ───────────────────────────────────────────────────────────

export function createQuestion(data: {
  text: Localized;
  sectionId: number;
  order: number;
  type: string;
}): Promise<QuestionRow> {
  for (const t of tests) {
    const s = t.sections?.find((x) => x.id === data.sectionId);
    if (s) {
      const q: QuestionRow = {
        id: nextId(),
        text: data.text,
        sectionId: data.sectionId,
        order: data.order,
        type: data.type,
        answers: [],
        createdAt: now(),
        updatedAt: now(),
      };
      s.questions.push(q);
      return delay(clone(q));
    }
  }
  return Promise.reject(new Error(`Section ${data.sectionId} not found`));
}

export function updateQuestion(
  id: number,
  data: { text?: Localized; type?: string; order?: number },
): Promise<QuestionRow> {
  for (const t of tests) {
    for (const s of t.sections ?? []) {
      const q = s.questions.find((x) => x.id === id);
      if (q) {
        Object.assign(q, data, { updatedAt: now() });
        return delay(clone(q));
      }
    }
  }
  return Promise.reject(new Error(`Question ${id} not found`));
}

export function deleteQuestion(id: number): Promise<void> {
  for (const t of tests) {
    for (const s of t.sections ?? []) {
      s.questions = s.questions.filter((x) => x.id !== id);
    }
  }
  return delay(undefined);
}

// ── Answers ─────────────────────────────────────────────────────────────

export function createAnswer(data: {
  text: Localized;
  questionId: number;
}): Promise<AnswerRow> {
  for (const t of tests) {
    for (const s of t.sections ?? []) {
      const q = s.questions.find((x) => x.id === data.questionId);
      if (q) {
        const a: AnswerRow = {
          id: nextId(),
          questionId: data.questionId,
          text: data.text,
          vars: [],
          createdAt: now(),
          updatedAt: now(),
        };
        q.answers.push(a);
        return delay(clone(a));
      }
    }
  }
  return Promise.reject(new Error(`Question ${data.questionId} not found`));
}

export function updateAnswer(
  id: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: { text?: Localized; vars?: any },
): Promise<AnswerRow> {
  for (const t of tests) {
    for (const s of t.sections ?? []) {
      for (const q of s.questions) {
        const a = q.answers.find((x) => x.id === id);
        if (a) {
          Object.assign(a, data, { updatedAt: now() });
          return delay(clone(a));
        }
      }
    }
  }
  return Promise.reject(new Error(`Answer ${id} not found`));
}

export function deleteAnswer(id: number): Promise<void> {
  for (const t of tests) {
    for (const s of t.sections ?? []) {
      for (const q of s.questions) {
        q.answers = q.answers.filter((x) => x.id !== id);
      }
    }
  }
  return delay(undefined);
}

// ── Public side: taking tests + results ──────────────────────────────────

export interface PublicTestSummary {
  id: number;
  name: Localized;
  desc: Localized | null;
  color: string | null;
  icon: string | null;
  category: string | null;
  duration: number | null;
  questionCount: number;
}

export interface ResultRecord {
  id: string;
  testId: number;
  answers: Record<string, number | string | string[]>;
  characteristics: Record<string, number>;
  topDimension: string | null;
  completedAt: string;
}

const results: ResultRecord[] = [];

function questionCount(t: TestRow): number {
  return (t.sections ?? []).reduce((n, s) => n + s.questions.length, 0);
}

export function fetchPublicTests(): Promise<PublicTestSummary[]> {
  const published = tests
    .filter((t) => t.state === "published")
    .map((t) => ({
      id: t.id,
      name: t.name,
      desc: t.desc,
      color: t.color,
      icon: t.icon,
      category: t.category,
      duration: t.duration,
      questionCount: questionCount(t),
    }));
  return delay(clone(published));
}

// Compute characteristic scores from raw answers using each answer's weights.
// answers: map of questionId -> chosen answerId(s).
export function submitTestResult(
  testId: number,
  answers: Record<string, number | string | string[]>,
): Promise<ResultRecord> {
  const t = findTest(testId);
  if (!t) return Promise.reject(new Error(`Test ${testId} not found`));

  const characteristics: Record<string, number> = {};
  for (const v of t.vars?.variables ?? []) characteristics[v.id] = 0;

  for (const s of t.sections ?? []) {
    for (const q of s.questions) {
      const picked = answers[String(q.id)];
      const pickedIds = Array.isArray(picked) ? picked : [picked];
      for (const a of q.answers) {
        if (pickedIds.map(String).includes(String(a.id))) {
          for (const w of (a.vars ?? []) as { variableId: string; value: number }[]) {
            characteristics[w.variableId] = (characteristics[w.variableId] ?? 0) + w.value;
          }
        }
      }
    }
  }

  let topDimension: string | null = null;
  let max = -Infinity;
  for (const [k, v] of Object.entries(characteristics)) {
    if (v > max) { max = v; topDimension = k; }
  }

  const record: ResultRecord = {
    id: `r${nextId()}`,
    testId,
    answers,
    characteristics,
    topDimension,
    completedAt: now(),
  };
  results.push(record);
  return delay(clone(record));
}

export function fetchResult(resultId: string): Promise<ResultRecord> {
  const r = results.find((x) => x.id === resultId);
  if (!r) return Promise.reject(new Error(`Result ${resultId} not found`));
  return delay(clone(r));
}
