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
  createdAt: string;
  updatedAt: string;
}

export interface QuestionRow {
  id: number;
  text: Localized;
  sectionId: number;
  order: number;
  type: string;
  answers: AnswerRow[];
  createdAt: string;
  updatedAt: string;
}

export interface SectionRow {
  id: number;
  title: Localized;
  testId: number;
  order: number;
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
  };
}

const tests: TestRow[] = [
  seedTest(
    1,
    L("Holland Career Test", "Тест Голланда", "Холланд тесті"),
    L("RIASEC career interest assessment", "Профориентационный тест RIASEC"),
    "published",
    "#0d9488",
    [
      {
        id: 11,
        title: L("Interests", "Интересы", "Қызығушылықтар"),
        testId: 1,
        order: 0,
        createdAt: now(),
        updatedAt: now(),
        questions: [
          {
            id: 101,
            text: L("Do you like fixing mechanical things?"),
            sectionId: 11,
            order: 0,
            type: "single",
            createdAt: now(),
            updatedAt: now(),
            answers: [
              { id: 1001, questionId: 101, text: L("Strongly yes"), vars: [], createdAt: now(), updatedAt: now() },
              { id: 1002, questionId: 101, text: L("Yes"), vars: [], createdAt: now(), updatedAt: now() },
              { id: 1003, questionId: 101, text: L("No"), vars: [], createdAt: now(), updatedAt: now() },
            ],
          },
        ],
      },
    ],
  ),
  seedTest(
    2,
    L("Big Five Personality", "Большая пятёрка", "Үлкен бестік"),
    L("OCEAN trait inventory", "Опросник черт OCEAN"),
    "draft",
    "#7c3aed",
  ),
  seedTest(
    3,
    L("Emotional Intelligence", "Эмоциональный интеллект", "Эмоционалды интеллект"),
    L("EQ self-assessment", "Самооценка EQ"),
    "draft",
    "#ea580c",
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
