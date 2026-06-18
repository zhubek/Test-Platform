"use client";

// Client for the dc_ Data Catalogs backend, plus a session cache of catalog
// GROUPS (with their slots and page templates) shared by the whole catalog UI
// — the hub, Parameters, group Pages, item editors, and ref resolution.
//
// Conventions: the frontend identifies a group by its NAME (professions,
// univerPrograms, custom slugs, …) — that's what hashes, refs ($catalog) and
// component props carry; the dc id is an internal detail resolved here.

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { apiFetch } from "./api-client";
import {
  getActiveProjectId,
  onActiveProjectChange,
  setActiveProjectScope,
} from "./active-project";
import type { Localized } from "./localized";

export type VarType = "text" | "number" | "boolean" | "date";

export interface DcVariable {
  id: string;
  varName: string;
  hasOptions: boolean;
  type: VarType;
  filterable: boolean;
  order: number;
}

/** Shape sent when defining/replacing a group's variable slots. */
export interface VariableInput {
  varName: string;
  type?: VarType;
  filterable?: boolean;
}

export interface DcPageBlock {
  id: string;
  blockId: string;
  order: number;
  props: Record<string, unknown>;
}

export interface DcPage {
  id: string;
  pageName: Localized;
  order: number;
  blocks: DcPageBlock[];
}

// Names/descriptions are plain single-language strings (translation handled
// separately).
export interface DcCharacteristic {
  id: string;
  name: string;
  description: string | null;
  order: number;
  archived?: boolean;
}

export interface DcCharacteristicGroup {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  archived?: boolean;
  characteristics: DcCharacteristic[];
}

/** A catalog group's attachment to a characteristic group (with the group nested). */
export interface DcGroupCharacteristicLink {
  characteristicGroupId: string;
  characteristicGroup: DcCharacteristicGroup;
}

export interface DcGroup {
  id: string;
  name: string;
  info: { label?: string; builtIn?: boolean } | null;
  isPublic: boolean;
  cardPageId: string | null;
  variables: DcVariable[];
  characteristics: DcGroupCharacteristicLink[];
  pages: DcPage[];
  _count?: { items: number };
}

export interface DcValue {
  id: string;
  variableId: string;
  value: Localized;
  variable: { varName: string };
}

export interface DcPageProp {
  id: string;
  pageBlockId: string;
  props: Record<string, unknown>;
}

export interface DcCharacteristicValue {
  id: string;
  characteristicId: string;
  value: number;
}

export interface DcItem {
  id: string;
  groupId: string;
  title: Localized;
  description: Localized | null;
  params: Record<string, unknown> | null;
  values: DcValue[];
  characteristicValues: DcCharacteristicValue[];
  pageProps: DcPageProp[];
}

// ── Groups cache ─────────────────────────────────────────────────────────────

let groups: DcGroup[] = [];
let loadPromise: Promise<DcGroup[]> | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function loadGroups(force = false): Promise<DcGroup[]> {
  if (!force && loadPromise) return loadPromise;
  const projectId = getActiveProjectId();
  const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
  loadPromise = apiFetch<DcGroup[]>(`/catalog-groups${qs}`).then((rows) => {
    groups = rows;
    notify();
    return rows;
  });
  return loadPromise;
}

// When the active project changes, the cached groups are for the wrong scope —
// drop them and refetch so every consumer re-renders with the new project's set.
onActiveProjectChange(() => {
  loadPromise = null;
  itemsCache.clear();
  void loadGroups(true);
});

export function getGroups(): DcGroup[] {
  return groups;
}

export function groupByName(name: string): DcGroup | undefined {
  return groups.find((g) => g.name === name);
}

export function useDcGroups(): DcGroup[] {
  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb);
    void loadGroups();
    return () => {
      listeners.delete(cb);
    };
  }, []);
  return useSyncExternalStore(subscribe, () => groups, () => groups);
}

/** Catalog groups exposed on the public site, in display order. Forces a fresh
 *  load on mount so admin changes (public flag, filters, card page) show up
 *  without a hard reload — the groups cache is otherwise memoized per session. */
export function usePublicGroups(): DcGroup[] {
  useEffect(() => {
    // The public site is cross-project: clear any admin scope and load all
    // groups, then keep only the public ones.
    setActiveProjectScope(undefined);
    void loadGroups(true);
  }, []);
  return useDcGroups().filter((g) => g.isPublic);
}

function upsertCachedGroup(row: DcGroup) {
  groups = groups.some((g) => g.id === row.id)
    ? groups.map((g) => (g.id === row.id ? row : g))
    : [...groups, row];
  notify();
}

// ── Group mutations ──────────────────────────────────────────────────────────

export async function createDcGroup(name: string, slots: VariableInput[]): Promise<DcGroup> {
  const row = await apiFetch<DcGroup>("/catalog-groups", {
    method: "POST",
    body: JSON.stringify({
      name,
      info: { label: name },
      projectId: getActiveProjectId(),
      variables: slots.filter((v) => v.varName),
    }),
  });
  upsertCachedGroup(row);
  return row;
}

export async function saveGroupVariables(
  groupId: string,
  variables: VariableInput[],
): Promise<DcGroup> {
  const row = await apiFetch<DcGroup>(`/catalog-groups/${groupId}`, {
    method: "PATCH",
    body: JSON.stringify({ variables: variables.filter((v) => v.varName) }),
  });
  upsertCachedGroup(row);
  return row;
}

/** Set the group's public flag and/or card-view page. */
export async function saveGroupSettings(
  groupId: string,
  patch: { isPublic?: boolean; cardPageId?: string | null },
): Promise<DcGroup> {
  const row = await apiFetch<DcGroup>(`/catalog-groups/${groupId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  upsertCachedGroup(row);
  return row;
}

export interface DcPagePayload {
  id?: string;
  pageName: Localized;
  blocks: { id?: string; blockId: string; props?: Record<string, unknown> }[];
}

export async function saveGroupPages(groupId: string, pages: DcPagePayload[]): Promise<DcGroup> {
  const row = await apiFetch<DcGroup>(`/catalog-groups/${groupId}`, {
    method: "PATCH",
    body: JSON.stringify({ pages }),
  });
  upsertCachedGroup(row);
  return row;
}

/** Set the catalog group's attached characteristic groups. */
export async function saveGroupCharacteristics(
  groupId: string,
  characteristicGroupIds: string[],
): Promise<DcGroup> {
  const row = await apiFetch<DcGroup>(`/catalog-groups/${groupId}`, {
    method: "PATCH",
    body: JSON.stringify({ characteristicGroupIds }),
  });
  upsertCachedGroup(row);
  return row;
}

// ── Characteristic groups (the global catalog of numeric dimension sets) ──────

let allCharGroups: DcCharacteristicGroup[] = [];
let charGroupsPromise: Promise<DcCharacteristicGroup[]> | null = null;

export function loadAllCharacteristicGroups(force = false): Promise<DcCharacteristicGroup[]> {
  if (!force && charGroupsPromise) return charGroupsPromise;
  charGroupsPromise = apiFetch<DcCharacteristicGroup[]>("/characteristic-groups").then((rows) => {
    allCharGroups = rows;
    return rows;
  });
  return charGroupsPromise;
}

export function getAllCharacteristicGroups(): DcCharacteristicGroup[] {
  return allCharGroups;
}

/** The characteristic groups attached to a catalog group (by name). */
export function attachedCharacteristicGroups(catalogName: string): DcCharacteristicGroup[] {
  return (groupByName(catalogName)?.characteristics ?? []).map((l) => l.characteristicGroup);
}

// ── Characteristic group / characteristic CRUD (the Characteristics catalog) ──

export function fetchCharacteristicGroup(id: string): Promise<DcCharacteristicGroup> {
  return apiFetch<DcCharacteristicGroup>(`/characteristic-groups/${id}`);
}

export async function createCharacteristicGroup(): Promise<DcCharacteristicGroup> {
  const row = await apiFetch<DcCharacteristicGroup>("/characteristic-groups", {
    method: "POST",
    body: JSON.stringify({ name: "" }),
  });
  await loadAllCharacteristicGroups(true).catch(() => {});
  return row;
}

export async function updateCharacteristicGroup(
  id: string,
  patch: { name?: string; description?: string; color?: string; archived?: boolean },
): Promise<DcCharacteristicGroup> {
  const row = await apiFetch<DcCharacteristicGroup>(`/characteristic-groups/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  await loadAllCharacteristicGroups(true).catch(() => {});
  return row;
}

/** Add a characteristic to a group; returns the updated group. */
export async function createCharacteristic(
  groupId: string,
  dto: { name?: string; description?: string },
): Promise<DcCharacteristicGroup> {
  const row = await apiFetch<DcCharacteristicGroup>(
    `/characteristic-groups/${groupId}/characteristics`,
    { method: "POST", body: JSON.stringify(dto) },
  );
  await loadAllCharacteristicGroups(true).catch(() => {});
  return row;
}

/** Update a characteristic (or archive it); returns the updated group. */
export async function updateCharacteristic(
  id: string,
  patch: { name?: string; description?: string; archived?: boolean },
): Promise<DcCharacteristicGroup> {
  const row = await apiFetch<DcCharacteristicGroup>(`/characteristics/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  await loadAllCharacteristicGroups(true).catch(() => {});
  return row;
}

// ── Items ────────────────────────────────────────────────────────────────────
// A small per-group cache backs ref resolution and item pickers; mutations
// invalidate it so pickers stay fresh.

const itemsCache = new Map<string, Promise<DcItem[]>>();

export function invalidateGroupItems(groupName?: string) {
  if (groupName) itemsCache.delete(groupName);
  else itemsCache.clear();
}

export function loadGroupItems(groupName: string): Promise<DcItem[]> {
  let p = itemsCache.get(groupName);
  if (!p) {
    p = loadGroups().then((gs) => {
      const g = gs.find((x) => x.name === groupName);
      return g ? apiFetch<DcItem[]>(`/catalog-groups/${g.id}/items`) : [];
    });
    itemsCache.set(groupName, p);
  }
  return p;
}

export function fetchDcItem(id: string): Promise<DcItem> {
  return apiFetch<DcItem>(`/catalog-items/${id}`);
}

export async function createDcItem(groupName: string): Promise<DcItem> {
  const gs = await loadGroups();
  const g = gs.find((x) => x.name === groupName);
  if (!g) throw new Error(`Catalog group "${groupName}" not found`);
  const row = await apiFetch<DcItem>(`/catalog-groups/${g.id}/items`, {
    method: "POST",
    body: JSON.stringify({ title: { en: "", ru: "", kk: "" } }),
  });
  invalidateGroupItems(groupName);
  return row;
}

export async function updateDcItem(
  id: string,
  patch: {
    title?: Localized;
    description?: Localized | null;
    params?: Record<string, unknown>;
    values?: Record<string, Localized | null>;
    pageProps?: Record<string, Record<string, unknown> | null>;
    characteristicValues?: Record<string, number | null>;
  },
  groupName?: string,
): Promise<DcItem> {
  const row = await apiFetch<DcItem>(`/catalog-items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  invalidateGroupItems(groupName);
  return row;
}

export async function deleteDcItem(id: string, groupName?: string): Promise<void> {
  await apiFetch(`/catalog-items/${id}`, { method: "DELETE" });
  invalidateGroupItems(groupName);
}

/** An item's extra-variable values as a varName-keyed record. */
export function itemValuesRecord(item: DcItem): Record<string, Localized> {
  return Object.fromEntries(item.values.map((v) => [v.variable.varName, v.value]));
}

/** An item's characteristic values as a characteristicId-keyed record. */
export function itemCharacteristicsRecord(item: DcItem): Record<string, number> {
  return Object.fromEntries(item.characteristicValues.map((v) => [v.characteristicId, v.value]));
}
