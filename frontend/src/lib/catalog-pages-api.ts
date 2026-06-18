"use client";

// Page TEMPLATES per catalog GROUP and per-ITEM prop values, backed by the
// dc_ backend (dc_group_pages / dc_group_page_blocks / dc_catalog_page_props).
// Templates only pick blocks — prop VALUES are filled per item.

import type { Localized } from "@/lib/localized";
import {
  fetchDcItem,
  groupByName,
  loadGroups,
  saveGroupPages,
  updateDcItem,
  type DcGroup,
  type DcPagePayload,
} from "./dc-catalogs";

export interface CatalogPageBlock {
  id: string;
  /** Block definition id in the shared library (uc_blocks). */
  blockId: string;
  /** Template prop values (kept empty in the simplified flow). */
  props: Record<string, unknown>;
}

export interface CatalogPageTemplate {
  id: string;
  title: Localized;
  blocks: CatalogPageBlock[];
}

let seq = 0;
/** Local-only id for not-yet-saved blocks (the backend assigns the real one). */
export const pageItemId = (prefix: string) => `local-${prefix}-${++seq}`;

const isLocalId = (id: string) => id.startsWith("local-");

function adaptPages(group: DcGroup): CatalogPageTemplate[] {
  return [...group.pages]
    .sort((a, b) => a.order - b.order)
    .map((p) => ({
      id: p.id,
      title: p.pageName,
      blocks: [...p.blocks]
        .sort((a, b) => a.order - b.order)
        .map((b) => ({ id: b.id, blockId: b.blockId, props: b.props ?? {} })),
    }));
}

function toPayload(pages: CatalogPageTemplate[]): DcPagePayload[] {
  return pages.map((p) => ({
    id: isLocalId(p.id) ? undefined : p.id,
    pageName: p.title,
    blocks: p.blocks.map((b) => ({
      id: isLocalId(b.id) ? undefined : b.id,
      blockId: b.blockId,
      props: b.props,
    })),
  }));
}

async function requireGroup(catalog: string): Promise<DcGroup> {
  const g = groupByName(catalog) ?? (await loadGroups()).find((x) => x.name === catalog);
  if (!g) throw new Error(`Catalog group "${catalog}" not found`);
  return g;
}

export async function fetchPageTemplates(catalog: string): Promise<CatalogPageTemplate[]> {
  return adaptPages(await requireGroup(catalog));
}

/** Save the full template set; returns the server state (real ids assigned). */
export async function savePageTemplates(
  catalog: string,
  pages: CatalogPageTemplate[],
): Promise<CatalogPageTemplate[]> {
  const g = await requireGroup(catalog);
  return adaptPages(await saveGroupPages(g.id, toPayload(pages)));
}

/**
 * Default templates are seeded on the BACKEND (seed-dc-catalogs); this just
 * loads whatever the group has. Kept for call-site compatibility.
 */
export async function ensureDefaultTemplates(
  catalog: string,
  _library: { id: string; name: string }[],
): Promise<CatalogPageTemplate[]> {
  return fetchPageTemplates(catalog);
}

// ── Per-item prop values ─────────────────────────────────────────────────────
// Keyed by template block instance id (dc_group_page_blocks.id).

export async function fetchItemPageProps(
  _catalog: string,
  entityId: number | string,
): Promise<Record<string, Record<string, unknown>>> {
  const item = await fetchDcItem(String(entityId));
  return Object.fromEntries(item.pageProps.map((p) => [p.pageBlockId, p.props]));
}

/** Replace one template block's values for an item; {} clears them. */
export async function setItemBlockProps(
  catalog: string,
  entityId: number | string,
  blockInstanceId: string,
  props: Record<string, unknown>,
): Promise<void> {
  await updateDcItem(
    String(entityId),
    { pageProps: { [blockInstanceId]: Object.keys(props).length ? props : null } },
    catalog,
  );
}
