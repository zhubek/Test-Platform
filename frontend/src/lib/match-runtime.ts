// Runtime catalog matching: turn a respondent's characteristic profile into the
// top-N matching catalog items (e.g. RIASEC interests → professions). Computed at
// submit time and stored as `reference` rows (top1..topN → a catalog item id +
// fit score) via the same SubmitEntry shape the take page already sends.

import type { DcItem, DcCharacteristicGroup } from "./dc-catalogs";
import type { SubmitEntry } from "./test-runtime";

export interface MatchConfig {
  id: string;
  catalogId: string; // catalog group NAME to match against
  groupId: string; // characteristic group id (the shared dimension space)
  method?: string; // "cosine" (only method for now)
  topN: number;
  prefix: string; // derived-var prefix → top1, top2, …
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Rank `items` against the user's `profile` over the characteristic group's
 * dimensions and emit the top-N as reference entries (value = fit %, refId = the
 * matched item). Profile keys are the characteristic names lowercased (e.g.
 * "realistic"), matching how the test scores its variables.
 */
export function computeMatchEntries(
  match: MatchConfig,
  profile: Record<string, unknown>,
  items: DcItem[],
  group: DcCharacteristicGroup | undefined,
): SubmitEntry[] {
  const chars = group?.characteristics ?? [];
  if (!chars.length) return [];

  const userVec = chars.map((c) => Number(profile[c.name.toLowerCase()]) || 0);
  if (userVec.every((v) => v === 0)) return []; // no signal → no matches

  const scored = items
    .map((it) => {
      const byChar = new Map(it.characteristicValues.map((cv) => [cv.characteristicId, cv.value]));
      const vec = chars.map((c) => Number(byChar.get(c.id)) || 0);
      return { id: it.id, score: cosine(userVec, vec) };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, match.topN));

  return scored.map((s, i) => ({
    variable: `${match.prefix}${i + 1}`,
    value: Math.round(s.score * 100), // fit %, 0–100
    kind: "reference",
    refType: "catalogItem",
    refId: s.id,
  }));
}
