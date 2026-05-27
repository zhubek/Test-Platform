import { findGroup } from "@/lib/catalog-characteristics";
import type { CatalogMapping, Variable } from "@/app/(admin)/admin/_components/mock-data";

// Characteristics are entirely driven by the catalog mappings: every mapped
// group's keys become characteristic variables. Author-edited formulas persist;
// we only add newly-mapped keys and drop ones no longer mapped. Other variable
// kinds are untouched. Returns the next variables array, or null if unchanged.
export function syncCharacteristics(
  mappings: CatalogMapping[],
  variables: Variable[],
): Variable[] | null {
  const wanted = new Map<string, { label: Variable["label"]; src: { catalogId: string; groupId: string } }>();
  for (const m of mappings) {
    const group = findGroup(m.catalogId, m.groupId);
    if (!group) continue;
    for (const k of group.keys) {
      if (!wanted.has(k.key)) wanted.set(k.key, { label: k.label, src: { catalogId: m.catalogId, groupId: m.groupId } });
    }
  }

  const managed = variables.filter((v) => v.kind === "characteristic");
  const untouched = variables.filter((v) => v.kind !== "characteristic");
  const haveByName = new Map(managed.map((v) => [v.name, v]));

  const nextChar: Variable[] = [];
  for (const [name, w] of wanted) {
    const existing = haveByName.get(name);
    if (existing) nextChar.push(existing);
    else
      nextChar.push({
        id: `char_${w.src.groupId}_${name}`,
        name,
        label: w.label,
        kind: "characteristic",
        formula: "",
        scope: "both",
        source: w.src,
      });
  }

  const sameSet =
    nextChar.length === managed.length && nextChar.every((v, i) => managed[i] && managed[i].id === v.id);
  return sameSet ? null : [...untouched, ...nextChar];
}
