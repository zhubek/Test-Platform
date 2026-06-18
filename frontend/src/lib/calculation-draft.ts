// The Calculation model: derived variables computed AFTER all answers are in.
// Inputs come from the Questions tab — each question's answer `field` and the
// declared test variables. A calculation variable is `name = expression`.
//
// A CATALOG MATCH picks a data catalog (e.g. Professions) + one of the
// characteristic groups attached to it (e.g. Interests/RIASEC) + a distance
// method + N. It seeds:
//   · one EDITABLE characteristic variable per characteristic (you write the
//     formula that scores it from answers), and
//   · read-only DERIVED variables top1…topN — each an OBJECT for the matched
//     catalog item, carrying its fields + extra variables plus `score` (fit %).
//     Reference e.g. top1.score, top1.salary, top1.name.
// Persisted on the test's advancedParams (calc = vars, matches = matches).

import { evaluate } from "./view-expr";
import { TEST_SAMPLE_CONTEXT } from "./mock-sources";
import { loadDraft, type QuestionsDraft } from "./question-instances";

// Preset distance methods (no custom logic — these are enough). Cosine is the
// default: vocational/interest matching is about the profile *shape*, not its
// absolute magnitude.
export type DistanceMethod = "cosine" | "euclidean" | "manhattan";
export const DISTANCE_METHODS: { id: DistanceMethod; label: string }[] = [
  { id: "cosine", label: "Cosine — matches the profile shape (recommended)" },
  { id: "euclidean", label: "Euclidean — straight-line; magnitude matters" },
  { id: "manhattan", label: "Manhattan — robust sum of gaps" },
];

// A configured match against a data catalog's characteristic space.
export interface CatalogMatch {
  id: string;
  catalogId: string; // dc catalog group NAME (e.g. "professions")
  catalogLabel: string; // display label
  groupId: string; // characteristic group id (attached to the catalog)
  groupName: string;
  groupColor?: string;
  method: DistanceMethod;
  topN: number;
  prefix: string; // derived-var prefix → `${prefix}1`, `${prefix}1score`
}

export interface CalcVar {
  id: string;
  name: string; // output variable name (machine identifier for formulas)
  expr: string; // expression over inputs + earlier calc vars (empty for derived)
  // When part of a catalog match, links the row to it (groups the UI, lets
  // removal clean up). Absent for standalone variables.
  matchId?: string;
  // Editable characteristic variable: you author its formula.
  characteristicId?: string;
  characteristicName?: string;
  // Read-only derived variable produced by the match (NOT editable): an OBJECT
  // top{rank} for the matched catalog item — its fields + extra variables, plus
  // `score` (fit %). e.g. top1.score, top1.salary, top1.name.
  derived?: "match";
  rank?: number; // 1-based, for derived vars
}

export interface CalculationDraft {
  vars: CalcVar[];
  matches: CatalogMatch[];
}

export const calcKey = (testId?: number | string) => `tp-calculation-${testId ?? "draft"}`;

export function loadCalculation(testId?: number | string): CalculationDraft {
  try {
    const raw = localStorage.getItem(calcKey(testId));
    if (!raw) return { vars: [], matches: [] };
    const parsed = JSON.parse(raw);
    return {
      vars: Array.isArray(parsed?.vars) ? parsed.vars : [],
      matches: Array.isArray(parsed?.matches) ? parsed.matches : [],
    };
  } catch {
    return { vars: [], matches: [] };
  }
}

export function saveCalculation(testId: number | string | undefined, draft: CalculationDraft) {
  try {
    localStorage.setItem(calcKey(testId), JSON.stringify(draft));
  } catch {
    /* quota — keep in-memory state */
  }
}

export interface InputVar {
  name: string;
  hint: string;
}

/** Inputs the calculation can reference: answer variables + test variables. */
export function questionInputs(q: QuestionsDraft): { answers: InputVar[]; testVars: InputVar[] } {
  const answers: InputVar[] = [];
  const seen = new Set<string>();
  for (const it of q.items) {
    const f = typeof it.props.field === "string" ? it.props.field.trim() : "";
    if (f && !seen.has(f)) {
      seen.add(f);
      answers.push({ name: f, hint: "answer" });
    }
  }
  const testVars: InputVar[] = q.vars
    .map((v) => v.name.trim())
    .filter(Boolean)
    .map((n) => ({ name: n, hint: "test variable" }));
  return { answers, testVars };
}

/**
 * A sample scope for previewing formulas: test variables at their initial
 * values, every answer field at a sample value, then calc vars folded in
 * document order (so a variable can build on earlier ones). `upTo` limits the
 * fold to vars before a given index (the scope a row sees).
 */
export function calcScope(
  q: QuestionsDraft,
  calc: CalcVar[],
  sampleAnswer: number,
  upTo = calc.length,
): Record<string, unknown> {
  const scope: Record<string, unknown> = { ...TEST_SAMPLE_CONTEXT };
  for (const v of q.vars) {
    const name = v.name.trim();
    if (!name) continue;
    const n = Number(v.initial);
    scope[name] = v.initial.trim() === "" ? 0 : Number.isFinite(n) ? n : v.initial;
  }
  const { answers } = questionInputs(q);
  for (const a of answers) scope[a.name] = sampleAnswer;
  for (let i = 0; i < upTo && i < calc.length; i++) {
    const cv = calc[i];
    const name = cv.name.trim();
    if (name && cv.expr.trim()) scope[name] = evaluate(cv.expr, scope);
  }
  return scope;
}

/** Slugify a characteristic/catalog name into a formula-safe identifier. */
export function slugVar(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return /^[a-z]/.test(s) ? s : `v_${s}`;
}

/** A name not already in `taken` (appends _2, _3, … on collision). */
function uniqueName(base: string, taken: Set<string>): string {
  let name = base || "var";
  let n = 2;
  while (taken.has(name)) name = `${base}_${n++}`;
  taken.add(name);
  return name;
}

/**
 * Build the variables a catalog match contributes:
 *  · one editable characteristic variable per characteristic (empty formula), and
 *  · read-only derived top{r} object variables for r = 1..topN.
 * `existingNames` is mutated to reserve the names it allocates.
 */
export function buildMatchVars(
  match: CatalogMatch,
  characteristics: { id: string; name: string }[],
  existingNames: Set<string>,
  uid: () => string,
): CalcVar[] {
  const out: CalcVar[] = [];
  for (const c of characteristics) {
    out.push({
      id: uid(),
      name: uniqueName(slugVar(c.name), existingNames),
      expr: "",
      matchId: match.id,
      characteristicId: c.id,
      characteristicName: c.name,
    });
  }
  for (let r = 1; r <= match.topN; r++) {
    out.push({ id: uid(), name: `${match.prefix}${r}`, expr: "", matchId: match.id, derived: "match", rank: r });
  }
  return out;
}

/** Pick a derived-var prefix that won't collide with existing names. */
export function matchPrefix(catalogId: string, existingNames: Set<string>): string {
  if (!existingNames.has("top1")) return "top";
  return `${slugVar(catalogId)}_top`;
}

/** Reload the question draft (answers + test vars) for the given test. */
export const loadQuestions = loadDraft;
