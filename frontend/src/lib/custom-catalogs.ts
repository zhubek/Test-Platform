"use client";

// Catalog groups + generic items, backed by the dc_ backend. The names here
// predate the wiring (this used to be the in-memory mock for USER-CREATED
// groups); the same generic shapes now serve every group — built-in and
// custom alike. A "group id" in the UI is the dc group NAME.

import type { Localized } from "@/lib/localized";
import {
  createDcGroup,
  createDcItem,
  deleteDcItem,
  fetchDcItem,
  itemCharacteristicsRecord,
  itemValuesRecord,
  loadGroupItems,
  updateDcItem,
  useDcGroups,
  type DcItem,
  type VariableInput,
} from "./dc-catalogs";

export interface CustomCatalogGroup {
  id: string; // dc group NAME — used as the catalog id everywhere in the UI
  name: string; // display label
}

export interface CustomItemRow {
  id: string;
  name: Localized;
  desc?: Localized | null;
  output?: Record<string, Localized>;
  /** Numeric characteristic values keyed by characteristic id. */
  characteristics?: Record<string, number>;
  access?: number[];
  createdAt?: string;
  updatedAt?: string;
}

function adaptItem(r: DcItem): CustomItemRow {
  return {
    id: r.id,
    name: r.title,
    desc: r.description,
    output: itemValuesRecord(r),
    characteristics: itemCharacteristicsRecord(r),
    access: Array.isArray(r.params?.access) ? (r.params.access as number[]) : [],
  };
}

/** Groups created through the UI (everything that isn't a seeded built-in). */
export function useCustomGroups(): CustomCatalogGroup[] {
  return useDcGroups()
    .filter((g) => !g.info?.builtIn)
    .map((g) => ({ id: g.name, name: g.info?.label ?? g.name }));
}

export async function createCatalogGroup(
  name: string,
  slots: VariableInput[],
): Promise<CustomCatalogGroup> {
  const row = await createDcGroup(name.trim() || "Untitled catalog", slots);
  return { id: row.name, name: row.info?.label ?? row.name };
}

// ── Generic item CRUD (group id = dc group name) ────────────────────────────

export async function fetchCustomItems(group: string): Promise<CustomItemRow[]> {
  return (await loadGroupItems(group)).map(adaptItem);
}

export async function fetchCustomItem(_group: string, id: string): Promise<CustomItemRow> {
  return adaptItem(await fetchDcItem(id));
}

export async function createCustomItem(group: string): Promise<CustomItemRow> {
  return adaptItem(await createDcItem(group));
}

export async function updateCustomItem(
  group: string,
  id: string,
  patch: Partial<Omit<CustomItemRow, "id">>,
): Promise<CustomItemRow> {
  const dcPatch: Parameters<typeof updateDcItem>[1] = {};
  if (patch.name !== undefined) dcPatch.title = patch.name;
  if (patch.desc !== undefined) dcPatch.description = patch.desc;
  if (patch.output !== undefined) dcPatch.values = patch.output;
  if (patch.characteristics !== undefined) dcPatch.characteristicValues = patch.characteristics;
  if (patch.access !== undefined) {
    // params is replaced wholesale on the backend — merge over the current.
    const current = await fetchDcItem(id);
    dcPatch.params = { ...(current.params ?? {}), access: patch.access };
  }
  return adaptItem(await updateDcItem(id, dcPatch, group));
}

export async function deleteCustomItem(group: string, id: string): Promise<void> {
  await deleteDcItem(id, group);
}
