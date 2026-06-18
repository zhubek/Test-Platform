// Shared model for block-based question instances — used by the test builder
// ("Questions · Blocks" tab) and the preview runner. A question is an instance
// of a TEST block: the block owns markup + widget, the instance owns values
// (prompt, field, options), data mappings, randomization, and logic
// (visibleIf + after-answered operations).

import { evaluate, interpolate } from "./view-expr";
import { runMetric, runQuery, type DbBinding } from "./mock-sources";
import type { BlockProp } from "./backend";
import { localize, type Localized } from "./localized";

// Context for resolving a prop tree in a given language. When `locale` is set,
// text/richtext props and the text leaves inside option lists are collapsed from
// their Localized map to the active language (see resolveValue). Omitted by
// language-neutral callers (e.g. the admin builder), which keeps current behavior.
export interface ResolveCtx {
  locale?: string;
  projectDefault?: string;
}

// A plain object whose keys are ALL BCP-47-ish language codes and whose values
// are ALL strings — i.e. a Localized map. This excludes option rows ({text,value}
// — `value` is a number) and binding envelopes ({$expr}/{$db} — `$` keys).
function isLocalizedMap(o: unknown): o is Localized {
  if (!o || typeof o !== "object" || Array.isArray(o)) return false;
  const keys = Object.keys(o as object);
  if (keys.length === 0) return false;
  return keys.every(
    (k) =>
      /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(k) &&
      typeof (o as Record<string, unknown>)[k] === "string",
  );
}

// Collapse Localized leaves to `locale`'s string, recursing arrays/objects so
// nested text (e.g. each option's `text`) is localized while siblings (numeric
// `value`) pass through untouched.
function localizeDeep(v: unknown, locale: string, projectDefault?: string): unknown {
  if (isLocalizedMap(v)) return localize(v, locale, projectDefault);
  if (Array.isArray(v)) return v.map((x) => localizeDeep(x, locale, projectDefault));
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      out[k] = localizeDeep(x, locale, projectDefault);
    }
    return out;
  }
  return v;
}

// A stored prop value: a plain static value, or a binding envelope.
export type StoredValue = unknown;

// One post-answer operation: `target = expr`, run when the question is
// answered. `answer` (the selected value) and all variables are in scope.
export interface Assign {
  target: string;
  expr: string;
}

export interface QuestionInstance {
  id: string;
  blockId: string;
  // Block ids change when the library is re-seeded; the name survives and lets
  // drafts self-heal (see resolveBlockRef).
  blockName?: string;
  props: Record<string, StoredValue>;
  randomize?: boolean; // shuffle option order per respondent
  visibleIf?: string; // expression — question shows only when truthy
  onAnswer?: Assign[]; // operations run right after this question is answered
}

/** Find the instance's block by id, falling back to the stored name. */
export function resolveBlockRef<T extends { id: string; name: string }>(
  item: QuestionInstance,
  blocks: T[],
): T | undefined {
  return (
    blocks.find((b) => b.id === item.blockId) ??
    (item.blockName ? blocks.find((b) => b.name === item.blockName) : undefined)
  );
}

// Test-level variables: declared name + initial value (number or text).
export interface TestVar {
  name: string;
  initial: string;
}

export interface QuestionsDraft {
  vars: TestVar[];
  items: QuestionInstance[];
}

export const draftKey = (testId?: number | string) => `tp-block-questions-${testId ?? "draft"}`;

export function loadDraft(testId?: number | string): QuestionsDraft {
  try {
    const raw = localStorage.getItem(draftKey(testId));
    if (!raw) return { vars: [], items: [] };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { vars: [], items: parsed }; // older drafts
    return { vars: parsed.vars ?? [], items: parsed.items ?? [] };
  } catch {
    return { vars: [], items: [] };
  }
}

export type SourceMode = "static" | "expr" | "db" | "ctx";

export const modeOf = (v: StoredValue): SourceMode => {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    if (o.$db) return "db";
    if (typeof o.$expr === "string") return "expr";
    if (typeof o.$ctx === "string") return "ctx";
  }
  return "static";
};

// A string that is EXACTLY one {{ expression }} (no surrounding text) resolves
// to the expression's RAW value, so a chart data cell like "{{realistic}}" keeps
// its number (72), not the string "72". Mixed text still interpolates to string.
const SINGLE_EXPR = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;

// Static values may carry inline {{expressions}} anywhere a string lives —
// including option texts and data-cell values inside arrays — so resolve them
// recursively.
export function deepInterpolate(v: unknown, scope: Record<string, unknown>): unknown {
  if (typeof v === "string") {
    const m = v.match(SINGLE_EXPR);
    return m ? evaluate(m[1], scope) : interpolate(v, scope);
  }
  if (Array.isArray(v)) return v.map((x) => deepInterpolate(x, scope));
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) out[k] = deepInterpolate(x, scope);
    return out;
  }
  return v;
}

// What an instance prop contributes to the render scope.
export function resolveValue(
  type: BlockProp["type"],
  v: StoredValue,
  scope: Record<string, unknown>,
  ctx?: ResolveCtx,
): unknown {
  const mode = modeOf(v);
  if (mode === "db") {
    const b = (v as { $db: DbBinding }).$db;
    return type === "json" || type === "list" ? runQuery(b) : runMetric(b);
  }
  if (mode === "expr") return evaluate((v as { $expr: string }).$expr, scope);
  if (mode === "ctx") {
    const path = (v as { $ctx: string }).$ctx;
    return evaluate(path, scope) ?? "";
  }
  // Static value: collapse Localized leaves to the active language (text props
  // are a single map; option lists carry text maps inside their rows), then
  // resolve inline {{expressions}}. Plain strings pass straight through.
  let base: unknown = v;
  if (ctx?.locale) {
    if (type === "text") {
      base = isLocalizedMap(v) ? localize(v, ctx.locale, ctx.projectDefault) : v;
    } else if (type === "json" || type === "list") {
      base = localizeDeep(v, ctx.locale, ctx.projectDefault);
    }
  }
  return deepInterpolate(base, scope);
}

// A block instance for rendering: anything carrying props + an id (questions,
// result/dashboard blocks). `randomize` is question-specific and optional.
export interface RenderableInstance {
  id: string;
  props: Record<string, StoredValue>;
  randomize?: boolean;
}

// Resolve all props of one instance against a scope, applying randomization.
export function resolveInstanceProps(
  item: RenderableInstance,
  propTypes: Map<string, BlockProp["type"]>,
  scope: Record<string, unknown>,
  ctx?: ResolveCtx,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [name, v] of Object.entries(item.props)) {
    resolved[name] = resolveValue(propTypes.get(name) ?? "text", v, scope, ctx);
    if (item.randomize && Array.isArray(resolved[name])) {
      resolved[name] = seededShuffle(resolved[name] as unknown[], item.id);
    }
  }
  return resolved;
}

// Seed the variable slots: declared vars at their initial values, plus every
// operation target defaulting to 0 so expressions never hit undefined.
export function applyVarDefaults(
  scope: Record<string, unknown>,
  vars: TestVar[],
  items: QuestionInstance[],
): void {
  for (const v of vars) {
    const name = v.name.trim();
    if (!name) continue;
    const n = Number(v.initial);
    scope[name] = v.initial.trim() === "" ? 0 : Number.isFinite(n) ? n : v.initial;
  }
  for (const it of items) {
    for (const a of it.onAnswer ?? []) {
      const t = a.target.trim();
      if (t && !(t in scope)) scope[t] = 0;
    }
  }
}

// Deterministic shuffle (FNV-1a seed + mulberry32) so a given seed always
// yields the same order; the runtime seeds per respondent.
export function seededShuffle<T>(arr: T[], seedStr: string): T[] {
  let h = 2166136261 >>> 0;
  for (const c of seedStr) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
