// Minimal API client — talks to the Test-Platform backend.
// Only the surface the copied admin pages need is exposed here; expand as the
// backend grows.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${init?.method ?? "GET"} ${path} → ${res.status} ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Shared types ────────────────────────────────────────────────────────

export interface Localized {
  en: string;
  ru: string;
  kz: string;
}

// ── Tests ───────────────────────────────────────────────────────────────

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

export function fetchTests(): Promise<TestRow[]> {
  return request<TestRow[]>("/tests");
}

export function fetchTest(id: number): Promise<TestRow> {
  return request<TestRow>(`/tests/${id}`);
}

export function createTest(data: TestInput): Promise<TestRow> {
  return request<TestRow>("/tests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTest(id: number, data: Partial<TestInput>): Promise<TestRow> {
  return request<TestRow>(`/tests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ── Sections ────────────────────────────────────────────────────────────

export function createSection(data: {
  title: Localized;
  testId: number;
  order: number;
}): Promise<SectionRow> {
  return request<SectionRow>("/sections", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateSection(
  id: number,
  data: { title?: Localized; order?: number },
): Promise<SectionRow> {
  return request<SectionRow>(`/sections/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteSection(id: number): Promise<void> {
  return request<void>(`/sections/${id}`, { method: "DELETE" });
}

// ── Questions ───────────────────────────────────────────────────────────

export function createQuestion(data: {
  text: Localized;
  sectionId: number;
  order: number;
  type: string;
}): Promise<QuestionRow> {
  return request<QuestionRow>("/questions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateQuestion(
  id: number,
  data: { text?: Localized; type?: string; order?: number },
): Promise<QuestionRow> {
  return request<QuestionRow>(`/questions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteQuestion(id: number): Promise<void> {
  return request<void>(`/questions/${id}`, { method: "DELETE" });
}

// ── Answers ─────────────────────────────────────────────────────────────

export function createAnswer(data: {
  text: Localized;
  questionId: number;
}): Promise<AnswerRow> {
  return request<AnswerRow>("/answers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function updateAnswer(
  id: number,
  data: { text?: Localized; vars?: any },
): Promise<AnswerRow> {
  return request<AnswerRow>(`/answers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteAnswer(id: number): Promise<void> {
  return request<void>(`/answers/${id}`, { method: "DELETE" });
}
