// Turn an attempt's stored variables + a test's result config into the
// ResultsDrawer model. Shared by the holder's home view and the org-admin
// results view, so both render results identically.

import { interpolate } from "./view-expr";
import { resultScopeFromStored } from "./test-runtime";
import type { Localized } from "./localized";
import type { ResultEntry, ScoreEntry } from "@/app/(public)/home/_components/results-drawer";

const L = (s: string): Localized => ({ en: s, ru: s, kk: s });

export interface ResultConfig {
  scores?: { variable: string; label: string; description?: string }[];
  summary?: string;
  professions?: Record<string, string[]>;
}

export interface ResultTest {
  advancedParams?: { calc?: { name: string; expr: string }[]; result?: ResultConfig };
}

export function buildResultEntry(
  test: ResultTest,
  variables: { variable: string; value: number }[],
  date: string,
): ResultEntry {
  const cfg = test.advancedParams?.result ?? {};
  const scope = resultScopeFromStored(variables, test.advancedParams?.calc ?? [], {});
  const defs = cfg.scores?.length
    ? cfg.scores
    : variables.map((v) => ({ variable: v.variable, label: v.variable, description: undefined }));
  const valued = defs.map((d) => ({ ...d, value: Number(scope[d.variable] ?? 0) }));
  const max = Math.max(0, ...valued.map((v) => v.value));
  const top = valued.find((v) => v.value === max && max > 0);

  const scores: ScoreEntry[] = valued.map((v) => ({
    label: L(v.label),
    value: v.value,
    high: v.value === max && max > 0,
    description: v.description ? L(v.description) : undefined,
  }));
  const summary = cfg.summary ? interpolate(cfg.summary, { ...scope, top: top?.label ?? "" }) : "";
  const professions = top && cfg.professions?.[top.label] ? cfg.professions[top.label].map(L) : [];
  return { date, summary: L(summary), scores, professions };
}

/** The top scoring label for an attempt (for compact list display). */
export function topLabel(test: ResultTest, variables: { variable: string; value: number }[]): string {
  const cfg = test.advancedParams?.result ?? {};
  const scope = resultScopeFromStored(variables, test.advancedParams?.calc ?? [], {});
  const defs = cfg.scores ?? variables.map((v) => ({ variable: v.variable, label: v.variable }));
  let best = "";
  let max = -Infinity;
  for (const d of defs) {
    const val = Number(scope[d.variable] ?? 0);
    if (val > max) {
      max = val;
      best = d.label;
    }
  }
  return max > 0 ? best : "";
}
