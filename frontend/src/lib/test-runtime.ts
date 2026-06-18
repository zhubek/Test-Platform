// The test runtime: turn a respondent's answers into the computed variables,
// the same way the admin preview does. Walk the question blocks in order,
// apply each answered question's after-answer operations, then fold the
// calculation variables. Numeric outputs are what gets stored in
// licenseTest_variables; non-numeric derived values (e.g. a top-type label) are
// recomputed at result time from the stored numbers.

import { evaluate, truthy } from "./view-expr";
import type { TestBlockInstance } from "./holder-api";

export interface CalcVar {
  name: string;
  expr: string;
}
export interface TestVar {
  name: string;
  initial: string;
}

const numOrSelf = (s: string): number | string => {
  const n = Number(s);
  return s.trim() !== "" && Number.isFinite(n) ? n : s;
};

/**
 * Build the full variable scope from answers. `answers` is keyed by question
 * field. Returns every named slot (test vars + operation targets + calc vars).
 */
export function computeScope(
  questions: TestBlockInstance[],
  calc: CalcVar[],
  vars: TestVar[],
  answers: Record<string, unknown>,
): Record<string, unknown> {
  const scope: Record<string, unknown> = {};
  // 1) declared variables at their initial values
  for (const v of vars) {
    const name = v.name?.trim();
    if (name) scope[name] = v.initial?.trim() ? numOrSelf(v.initial) : 0;
  }
  // 2) operation targets default to 0 so expressions never hit undefined
  for (const q of questions) for (const op of q.advancedParams?.onAnswer ?? []) {
    const t = op.target?.trim();
    if (t && !(t in scope)) scope[t] = 0;
  }
  // 3) walk questions in order; answered + visible ones run their operations
  for (const q of questions) {
    const visible = !q.advancedParams?.visibleIf?.trim() || truthy(q.advancedParams.visibleIf, scope);
    if (!visible) continue;
    const field = typeof q.props?.field === "string" ? q.props.field.trim() : "";
    const answer = field ? answers[field] : undefined;
    if (answer === undefined) continue;
    scope[field] = answer;
    for (const op of q.advancedParams?.onAnswer ?? []) {
      const t = op.target?.trim();
      if (t && op.expr?.trim()) scope[t] = evaluate(op.expr, { ...scope, answer });
    }
  }
  // 4) fold the calculation variables in order
  for (const c of calc) {
    const name = c.name?.trim();
    if (name && c.expr?.trim()) scope[name] = evaluate(c.expr, scope);
  }
  return scope;
}

/** The names worth persisting/showing: declared vars + op targets + calc vars. */
export function variableNames(questions: TestBlockInstance[], calc: CalcVar[], vars: TestVar[]): string[] {
  const names = new Set<string>();
  for (const v of vars) if (v.name?.trim()) names.add(v.name.trim());
  for (const q of questions) for (const op of q.advancedParams?.onAnswer ?? []) if (op.target?.trim()) names.add(op.target.trim());
  for (const c of calc) if (c.name?.trim()) names.add(c.name.trim());
  return [...names];
}

/** The numeric subset of a scope — exactly what licenseTest_variables stores. */
export function numericVariables(scope: Record<string, unknown>, names: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const n of names) {
    const v = Number(scope[n]);
    if (Number.isFinite(v)) out[n] = Math.round(v * 1000) / 1000;
  }
  return out;
}

/**
 * Rebuild the result scope from STORED variables, then re-fold the calculation
 * so derived non-numeric values (e.g. a top-type label) are available again.
 */
export function resultScopeFromStored(
  stored: { variable: string; value: number }[],
  calc: CalcVar[],
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  const scope: Record<string, unknown> = { ...extra };
  for (const s of stored) scope[s.variable] = s.value;
  for (const c of calc) {
    const name = c.name?.trim();
    if (name && c.expr?.trim()) scope[name] = evaluate(c.expr, scope);
  }
  return scope;
}
