// A catalog match's top{r} output is an OBJECT for the matched catalog item:
// its name + extra variables + characteristics, plus `score` (fit %). This
// module builds those objects (for preview sample data) and lists their fields
// (for the variable picker), so the Calculation and Result tabs agree.

import { slugVar, type CatalogMatch } from "./calculation-draft";
import type { DcCharacteristic, DcGroup, DcItem } from "./dc-catalogs";
import { localize } from "./localized";
import type { Locale } from "./i18n";

export interface FieldToken {
  token: string;
  hint: string;
}

/** The fields a top{r} object exposes — name, score, and each extra variable. */
export function matchObjectFields(group: DcGroup | undefined): FieldToken[] {
  const fields: FieldToken[] = [
    { token: "name", hint: "catalog item name" },
    { token: "score", hint: "fit % (0–100)" },
  ];
  for (const v of group?.variables ?? []) fields.push({ token: v.varName, hint: "extra variable" });
  return fields;
}

/**
 * Build a top{r} object from a real catalog item (preview sample data):
 * { id, name, rank, score, <extra vars by name>, <characteristics by slug> }.
 */
export function buildMatchObject(
  item: DcItem,
  rank: number,
  score: number,
  group: DcGroup | undefined,
  characteristics: DcCharacteristic[],
  locale: Locale,
): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    id: item.id,
    name: localize(item.title, locale),
    rank,
    score,
  };
  const typeByName = new Map((group?.variables ?? []).map((v) => [v.varName, v.type]));
  for (const val of item.values) {
    const name = val.variable.varName;
    const raw = localize(val.value, locale);
    obj[name] = typeByName.get(name) === "number" ? Number(raw) || 0 : raw;
  }
  const nameById = new Map(characteristics.map((c) => [c.id, c.name]));
  for (const cv of item.characteristicValues) {
    const nm = nameById.get(cv.characteristicId);
    if (nm) obj[slugVar(nm)] = cv.value;
  }
  return obj;
}

/** N random scores in 1–100, sorted descending so top1 ≥ top2 ≥ … (by rank). */
export function sampleScores(n: number): number[] {
  return Array.from({ length: Math.max(0, n) }, () => 1 + Math.floor(Math.random() * 100)).sort(
    (a, b) => b - a,
  );
}

/** Pick n items at random (distinct where possible, repeating only if too few). */
export function pickRandomItems(items: DcItem[], n: number): DcItem[] {
  if (items.length === 0) return [];
  const pool = [...items];
  const out: DcItem[] = [];
  for (let i = 0; i < n; i++) {
    if (pool.length === 0) pool.push(...items);
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

/** The characteristic group attached to a match, resolved from the catalog. */
export function matchCharacteristics(group: DcGroup | undefined, match: CatalogMatch): DcCharacteristic[] {
  const link = group?.characteristics.find((l) => l.characteristicGroupId === match.groupId);
  return link?.characteristicGroup.characteristics ?? [];
}
