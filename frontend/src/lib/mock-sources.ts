// Mock data-source registry — a frontend stand-in for the future backend
// /data-sources API, so the binding UI can be designed and tried end-to-end
// before the backend exists. Shapes mirror what the real registry will return:
// each source is self-describing (key, fields) and queryable (filter / sort /
// limit / map for collections, metric for scalars). Queries run in the browser
// over the sample rows below; later the same DbBinding object is sent to the
// backend instead and nothing in the UI changes.

import { evaluate, interpolate, resolvePath } from "./view-expr";

export interface SourceField {
  key: string;
  type: "string" | "number";
}

export interface DataSource {
  key: string;
  label: string;
  group: "Catalogs" | "Answers";
  fields: SourceField[];
  rows: Record<string, unknown>[];
}

export const SOURCES: DataSource[] = [
  {
    key: "professions",
    label: "Professions",
    group: "Catalogs",
    fields: [
      { key: "title", type: "string" },
      { key: "category", type: "string" },
      { key: "city", type: "string" },
      { key: "demand", type: "number" },
      { key: "salary", type: "number" },
    ],
    rows: [
      { title: "Software Developer", category: "IT", city: "Almaty", demand: 92, salary: 650000 },
      { title: "Data Analyst", category: "IT", city: "Astana", demand: 81, salary: 520000 },
      { title: "Nurse", category: "Healthcare", city: "Shymkent", demand: 85, salary: 210000 },
      { title: "Teacher", category: "Education", city: "Almaty", demand: 74, salary: 180000 },
      { title: "Accountant", category: "Finance", city: "Astana", demand: 58, salary: 320000 },
      { title: "Marketing Manager", category: "Business", city: "Almaty", demand: 66, salary: 410000 },
      { title: "Civil Engineer", category: "Engineering", city: "Astana", demand: 71, salary: 380000 },
      { title: "Graphic Designer", category: "Creative", city: "Almaty", demand: 54, salary: 290000 },
      { title: "Psychologist", category: "Healthcare", city: "Shymkent", demand: 62, salary: 250000 },
      { title: "Electrician", category: "Trades", city: "Karaganda", demand: 77, salary: 270000 },
    ],
  },
  {
    key: "universities",
    label: "Universities",
    group: "Catalogs",
    fields: [
      { key: "name", type: "string" },
      { key: "city", type: "string" },
      { key: "students", type: "number" },
      { key: "rating", type: "number" },
    ],
    rows: [
      { name: "Nazarbayev University", city: "Astana", students: 6800, rating: 94 },
      { name: "KazNU al-Farabi", city: "Almaty", students: 25000, rating: 88 },
      { name: "KBTU", city: "Almaty", students: 5200, rating: 86 },
      { name: "ENU Gumilyov", city: "Astana", students: 18500, rating: 82 },
      { name: "Satbayev University", city: "Almaty", students: 11400, rating: 80 },
      { name: "KarTU", city: "Karaganda", students: 9600, rating: 73 },
    ],
  },
  {
    key: "cities",
    label: "Cities",
    group: "Catalogs",
    fields: [
      { key: "name", type: "string" },
      { key: "region", type: "string" },
      { key: "population", type: "number" },
    ],
    rows: [
      { name: "Almaty", region: "Almaty", population: 2150000 },
      { name: "Astana", region: "Akmola", population: 1450000 },
      { name: "Shymkent", region: "Turkistan", population: 1200000 },
      { name: "Karaganda", region: "Karaganda", population: 510000 },
      { name: "Aktobe", region: "Aktobe", population: 420000 },
    ],
  },
  {
    key: "answers.by-scale",
    label: "Answers · by scale (aggregated)",
    group: "Answers",
    fields: [
      { key: "scale", type: "string" },
      { key: "label", type: "string" },
      { key: "avgScore", type: "number" },
      { key: "respondents", type: "number" },
    ],
    rows: [
      { scale: "R", label: "Realistic", avgScore: 68, respondents: 412 },
      { scale: "I", label: "Investigative", avgScore: 61, respondents: 412 },
      { scale: "A", label: "Artistic", avgScore: 55, respondents: 412 },
      { scale: "S", label: "Social", avgScore: 72, respondents: 412 },
      { scale: "E", label: "Enterprising", avgScore: 64, respondents: 412 },
      { scale: "C", label: "Conventional", avgScore: 49, respondents: 412 },
    ],
  },
  {
    key: "answers.by-school",
    label: "Answers · by school (aggregated)",
    group: "Answers",
    fields: [
      { key: "school", type: "string" },
      { key: "city", type: "string" },
      { key: "completed", type: "number" },
      { key: "avgScore", type: "number" },
    ],
    rows: [
      { school: "School #25", city: "Almaty", completed: 248, avgScore: 71 },
      { school: "Lyceum #134", city: "Almaty", completed: 196, avgScore: 75 },
      { school: "NIS Astana", city: "Astana", completed: 312, avgScore: 79 },
      { school: "School #7", city: "Shymkent", completed: 154, avgScore: 66 },
      { school: "Gymnasium #1", city: "Karaganda", completed: 122, avgScore: 69 },
      { school: "School #48", city: "Astana", completed: 178, avgScore: 72 },
    ],
  },
];

export const sourceByKey = (key: string) => SOURCES.find((s) => s.key === key);

// ---------------------------------------------------------------------------
// Query model. A DbBinding is what gets stored inside a bound prop's value
// (as { $db: binding }) and — later — sent to the backend to execute.

export interface DbFilter {
  field: string;
  op: "eq" | "gte" | "lte" | "contains";
  value: string;
}

export interface MapPair {
  to: string; // name the template expects (e.g. "text", "value")
  // Same syntax as every other authored field: static text mixed with
  // {{expressions}}, run once per row with the row's columns (+ `index`) in
  // scope — "{{title}} ({{city}})". A value that is EXACTLY one {{expression}}
  // keeps its raw type (numbers stay numbers — important for scoring values).
  from: string;
}

const SINGLE_EXPR = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;

/** Resolve one map template against a row scope (also used for editor previews). */
export function mapRowValue(template: string, scope: Record<string, unknown>): unknown {
  const m = template.match(SINGLE_EXPR);
  return m ? evaluate(m[1], scope) : interpolate(template, scope);
}

export interface DbBinding {
  source: string;
  filters: DbFilter[];
  sort?: string;
  dir?: "asc" | "desc";
  limit?: number;
  map?: MapPair[];
  metric?: string; // scalar props: "count" | "avg:field" | "sum:field" | ...
}

export const emptyDbBinding = (): DbBinding => ({ source: "", filters: [] });

function passes(row: Record<string, unknown>, f: DbFilter): boolean {
  if (!f.field || f.value === "") return true; // incomplete filter = inactive
  const v = row[f.field];
  switch (f.op) {
    case "eq": return String(v) === f.value;
    case "gte": return Number(v) >= Number(f.value);
    case "lte": return Number(v) <= Number(f.value);
    case "contains": return String(v).toLowerCase().includes(f.value.toLowerCase());
  }
}

export function distinctValues(sourceKey: string, field: string): string[] {
  const src = sourceByKey(sourceKey);
  if (!src) return [];
  return [...new Set(src.rows.map((r) => String(r[field] ?? "")))].sort();
}

export function runQuery(b: DbBinding): Record<string, unknown>[] {
  const src = sourceByKey(b.source);
  if (!src) return [];
  let out = src.rows.filter((r) => b.filters.every((f) => passes(r, f)));
  if (b.sort) {
    const k = b.sort;
    const sign = b.dir === "desc" ? -1 : 1;
    out = [...out].sort((a, z) => {
      const av = a[k], zv = z[k];
      const an = Number(av), zn = Number(zv);
      const cmp = Number.isFinite(an) && Number.isFinite(zn) ? an - zn : String(av).localeCompare(String(zv));
      return cmp * sign;
    });
  }
  if (b.limit && b.limit > 0) out = out.slice(0, b.limit);
  if (b.map?.length) {
    // Mapped names are added on top of the original columns, so templates can
    // use either. Each `from` is a {{ }} template run once per row (foreach):
    // the row's columns + `index` are the scope.
    out = out.map((r, index) => {
      const m: Record<string, unknown> = { ...r };
      const scope = { ...r, index };
      for (const p of b.map!) if (p.to && p.from.trim()) m[p.to] = mapRowValue(p.from, scope);
      return m;
    });
  }
  return out;
}

export const METRIC_FNS = ["count", "avg", "sum", "min", "max"] as const;

export function runMetric(b: DbBinding): number {
  const rows = runQuery({ ...b, map: undefined, limit: undefined, sort: undefined });
  const m = b.metric || "count";
  if (m === "count") return rows.length;
  const [fn, field] = m.split(":");
  const nums = rows.map((r) => Number(r[field])).filter((n) => Number.isFinite(n));
  if (!nums.length) return 0;
  const sum = nums.reduce((a, n) => a + n, 0);
  switch (fn) {
    case "sum": return Math.round(sum * 100) / 100;
    case "avg": return Math.round((sum / nums.length) * 100) / 100;
    case "min": return Math.min(...nums);
    case "max": return Math.max(...nums);
    default: return rows.length;
  }
}

// Resolve a stored prop value: bound values persist as { $db } / { $ctx }
// envelopes inside the prop's JSON; anything else is a plain static value.
export function resolveStoredProp(type: string, value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    if (v.$db) {
      const b = v.$db as DbBinding;
      return type === "json" || type === "list" ? runQuery(b) : runMetric(b);
    }
    if (typeof v.$ctx === "string") return resolvePath(v.$ctx, SAMPLE_CONTEXT) ?? "";
  }
  return value;
}

// ---------------------------------------------------------------------------
// Sample runtime context — what a Context binding resolves against in the
// editor. At runtime the real context (viewer, their result, the page's filter
// panel values) takes its place.

const TODAY = new Date().toISOString().slice(0, 10);

export const SAMPLE_CONTEXT: Record<string, unknown> = {
  user: { name: "Aigerim S.", org: "School #25", role: "Student", grade: 9 },
  result: {
    total: 78,
    topScale: "S",
    completedAt: "2026-05-30",
    scales: { R: 72, I: 64, A: 51, S: 80, E: 58, C: 45 },
  },
  filters: { city: "Almaty", period: "2026-Q2" },
  today: TODAY,
};

export const CONTEXT_PATHS = [
  "user.name",
  "user.org",
  "user.role",
  "user.grade",
  "result.total",
  "result.topScale",
  "result.completedAt",
  "result.scales.R",
  "result.scales.I",
  "result.scales.A",
  "result.scales.S",
  "result.scales.E",
  "result.scales.C",
  "filters.city",
  "filters.period",
  "today",
];

// While BUILDING a test there is no result yet — the test-builder surface gets
// the viewer + the current date only. result.* belongs to results/dashboards.
export const TEST_SAMPLE_CONTEXT: Record<string, unknown> = {
  user: SAMPLE_CONTEXT.user,
  filters: SAMPLE_CONTEXT.filters,
  today: TODAY,
};

export const TEST_CONTEXT_PATHS = CONTEXT_PATHS.filter((p) => !p.startsWith("result."));
