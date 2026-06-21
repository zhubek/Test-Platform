// The Dashboard model: a page of view blocks (charts, tiles) whose props bind to
// PROJECT-WIDE result variables — the union of license_test_variables across the
// project's tests. Preview values come from the last few completed attempts.
// Prototype storage: localStorage per dashboard id (DB-backed later).

import type { StoredValue } from "./question-instances";
import type { ProjectAttempt } from "./backend";

export interface DashboardBlockInstance {
  id: string;
  blockId: string;
  blockName?: string;
  props: Record<string, StoredValue>;
}

export interface DashboardDraft {
  blocks: DashboardBlockInstance[];
}

export const dashboardKey = (id?: string) => `tp-dashboard-${id ?? "draft"}`;

export function loadDashboard(id?: string): DashboardDraft {
  try {
    const raw = localStorage.getItem(dashboardKey(id));
    if (!raw) return { blocks: [] };
    const parsed = JSON.parse(raw);
    return { blocks: Array.isArray(parsed?.blocks) ? parsed.blocks : [] };
  } catch {
    return { blocks: [] };
  }
}

export function saveDashboard(id: string | undefined, draft: DashboardDraft) {
  try {
    localStorage.setItem(dashboardKey(id), JSON.stringify(draft));
  } catch {
    /* quota — keep in-memory state */
  }
}

// ── Starter dashboards ───────────────────────────────────────────────────────
// Default layouts keyed by dashboard id, used when nothing is saved yet. Blocks
// are referenced by NAME (blockId resolves on load via resolveBlockRef), so they
// work across re-seeds. Bound to the project's real result variables.
const RIASEC_ROWS = [
  { name: "Realistic", value: "{{realistic}}" },
  { name: "Investigative", value: "{{investigative}}" },
  { name: "Artistic", value: "{{artistic}}" },
  { name: "Social", value: "{{social}}" },
  { name: "Enterprising", value: "{{enterprising}}" },
  { name: "Conventional", value: "{{conventional}}" },
];
const inst = (
  id: string,
  blockName: string,
  props: Record<string, StoredValue>,
): DashboardBlockInstance => ({ id, blockId: "", blockName, props });

export const DASHBOARD_PRESETS: Record<string, DashboardBlockInstance[]> = {
  "student-overview": [
    inst("p1", "KPI row — operations & conditionals", {
      completed: { $expr: "count" },
      total: { $expr: "count" },
      target: 50,
    }),
    inst("p2", "Bar chart — scores by category", {
      title: "RIASEC interest profile",
      accent: "#4f46e5",
      scores: RIASEC_ROWS,
    }),
    inst("p3", "Radial gauge — completion rate", {
      title: "Average total score",
      completed: { $expr: "total" },
      total: 60,
    }),
  ],
  "test-results": [
    inst("p1", "Bar chart — scores by category", {
      title: "Interest scores",
      accent: "#0d9488",
      scores: RIASEC_ROWS,
    }),
    inst("p2", "Donut chart — license usage", {
      title: "Interest split",
      slices: RIASEC_ROWS,
    }),
    inst("p3", "Radial gauge — completion rate", {
      title: "Total score",
      completed: { $expr: "total" },
      total: 60,
    }),
  ],
};

export interface ScopeVar {
  name: string;
  hint: string;
}

/** Distinct result-variable names across the project's attempts (latest value as hint). */
export function attemptVars(attempts: ProjectAttempt[]): ScopeVar[] {
  const seen = new Map<string, number>();
  for (const a of attempts) {
    for (const v of a.variables) if (!seen.has(v.variable)) seen.set(v.variable, v.value);
  }
  return [...seen.entries()].map(([name, val]) => ({ name, hint: String(val) }));
}

/** One attempt flattened to a row: its variables + a little meta. */
function flatten(a: ProjectAttempt): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const v of a.variables) o[v.variable] = v.value;
  o.student = a.license.holder?.name ?? a.license.holder?.login ?? "—";
  o.test = a.test.name?.en ?? "Test";
  o.when = a.endTime ? new Date(a.endTime).toLocaleDateString() : "";
  return o;
}

/**
 * The dashboard preview scope, built from the last few attempts:
 *  · each variable → its latest value (the newest attempt that has it),
 *  · `recent` → the last N attempts flattened (for charts / series),
 *  · `count` → number of completed attempts in the project.
 */
export function dashboardScope(attempts: ProjectAttempt[], sample = 8): Record<string, unknown> {
  const scope: Record<string, unknown> = {};
  for (const a of attempts) {
    for (const v of a.variables) if (!(v.variable in scope)) scope[v.variable] = v.value;
  }
  scope.recent = attempts.slice(0, sample).map(flatten);
  scope.count = attempts.length;
  return scope;
}
