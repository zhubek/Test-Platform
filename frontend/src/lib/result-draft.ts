// The Result View model: a page composed of view blocks (charts, tiles, text)
// whose props bind to the RESULT scope — the test's characteristics/calculated
// variables (from the Calculation tab) and the project parameters. Same block-
// instance machinery as the questions builder; prototype localStorage per test.

import type { StoredValue } from "./question-instances";
import type { ProjectParameter } from "./project-context";
import { localize } from "./localized";
import type { Locale } from "./i18n";
import { SAMPLE_CONTEXT } from "./mock-sources";
import { calcScope, loadCalculation, loadQuestions, slugVar, type CalcVar } from "./calculation-draft";

export interface ResultBlockInstance {
  id: string;
  blockId: string;
  blockName?: string;
  props: Record<string, StoredValue>;
}

export interface ResultDraft {
  blocks: ResultBlockInstance[];
}

export const resultKey = (testId?: number | string) => `tp-result-view-${testId ?? "draft"}`;

export function loadResult(testId?: number | string): ResultDraft {
  try {
    const raw = localStorage.getItem(resultKey(testId));
    if (!raw) return { blocks: [] };
    const parsed = JSON.parse(raw);
    return { blocks: Array.isArray(parsed?.blocks) ? parsed.blocks : [] };
  } catch {
    return { blocks: [] };
  }
}

export function saveResult(testId: number | string | undefined, draft: ResultDraft) {
  try {
    localStorage.setItem(resultKey(testId), JSON.stringify(draft));
  } catch {
    /* quota — keep in-memory state */
  }
}

export interface ScopeVar {
  name: string;
  hint: string;
}

/** The calculation variables (characteristics + custom) this test produces. */
export function characteristicVars(testId?: number | string): CalcVar[] {
  return loadCalculation(testId).vars.filter((v) => v.name.trim());
}

/** Project parameters as variable tokens (slug of the label) + a sample value. */
export function parameterVars(params: ProjectParameter[], locale: Locale): ScopeVar[] {
  return params.map((p) => ({
    name: slugVar(localize(p.label, locale) || p.id),
    hint: p.type === "multiple" ? "parameter (multi)" : "parameter",
  }));
}

/**
 * Build the RESULT preview scope: characteristics at their computed sample
 * values, parameters at a sample option, and the full runtime context (result.*
 * exists here, unlike during the test). `sampleAnswer` drives the characteristic
 * computation the same way the Calculation preview does.
 */
export function resultScope(
  testId: number | string | undefined,
  params: ProjectParameter[],
  locale: Locale,
  sampleAnswer = 3,
): Record<string, unknown> {
  const questions = loadQuestions(testId);
  const calc = loadCalculation(testId).vars;
  // characteristics + calc vars folded over sample answers
  const scope: Record<string, unknown> = { ...calcScope(questions, calc, sampleAnswer) };
  // parameters: single → first option text, multiple → array of option texts
  for (const p of params) {
    const name = slugVar(localize(p.label, locale) || p.id);
    const opts = p.options.map((o) => localize(o, locale));
    scope[name] = p.type === "multiple" ? opts.slice(0, 1) : opts[0] ?? "";
  }
  // result.* is available on the result surface
  Object.assign(scope, SAMPLE_CONTEXT);
  return scope;
}
