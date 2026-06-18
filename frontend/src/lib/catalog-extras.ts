"use client";

// Extra-variable SLOTS, defined per catalog group. Backed by the dc_ backend
// (dc_extra_variables via /catalog-groups) through the shared groups cache —
// table headers, item editors, and the Parameters tab all read the same data.
// Values are filled per item (dc_catalog_extra_values).

import {
  getGroups,
  groupByName,
  loadGroups,
  saveGroupVariables,
  useDcGroups,
  type VarType,
} from "./dc-catalogs";

const EMPTY: string[] = [];

/** A group's extra-variable slot, with its kind and filter exposure. */
export interface ExtraSlot {
  varName: string;
  type: VarType;
  filterable: boolean;
}
const EMPTY_DEFS: ExtraSlot[] = [];

// Stable array identity per group so render-time consumers don't churn.
const slotCache = new Map<string, { src: unknown; slots: string[] }>();
const slotDefCache = new Map<string, { src: unknown; defs: ExtraSlot[] }>();

function slotsOf(catalog: string): string[] {
  const g = groupByName(catalog);
  if (!g) return EMPTY;
  const cached = slotCache.get(catalog);
  if (cached && cached.src === g.variables) return cached.slots;
  const slots = [...g.variables].sort((a, b) => a.order - b.order).map((v) => v.varName);
  slotCache.set(catalog, { src: g.variables, slots });
  return slots;
}

function slotDefsOf(catalog: string): ExtraSlot[] {
  const g = groupByName(catalog);
  if (!g) return EMPTY_DEFS;
  const cached = slotDefCache.get(catalog);
  if (cached && cached.src === g.variables) return cached.defs;
  const defs = [...g.variables]
    .sort((a, b) => a.order - b.order)
    .map((v) => ({ varName: v.varName, type: v.type, filterable: v.filterable }));
  slotDefCache.set(catalog, { src: g.variables, defs });
  return defs;
}

export function getExtraSlots(catalog: string): string[] {
  if (getGroups().length === 0) void loadGroups();
  return slotsOf(catalog);
}

/** Replace a group's slot definitions. De-dupes by name and drops blanks;
 *  order is meaningful (first five become table columns). */
export async function setExtraSlots(catalog: string, next: ExtraSlot[]): Promise<void> {
  const g = groupByName(catalog) ?? (await loadGroups()).find((x) => x.name === catalog);
  if (!g) throw new Error(`Catalog group "${catalog}" not found`);
  const seen = new Set<string>();
  const variables = next
    .map((s) => ({ ...s, varName: s.varName.trim() }))
    .filter((s) => s.varName && !seen.has(s.varName) && seen.add(s.varName));
  await saveGroupVariables(g.id, variables);
}

/** Reactive slot-name list for a catalog group (table columns, item editors). */
export function useExtraSlots(catalog: string): string[] {
  useDcGroups(); // subscribe to the groups cache
  return slotsOf(catalog);
}

/** Reactive full slot definitions (name + type + filterable) for the editor. */
export function useExtraSlotDefs(catalog: string): ExtraSlot[] {
  useDcGroups();
  return slotDefsOf(catalog);
}
