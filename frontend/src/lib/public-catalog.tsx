"use client";

// Public rendering of catalog items through their group's page templates.
// Powers /explore (each item's "Card" page) and /professions/[id] (every other
// page as a tab). Data comes from the dc backend; blocks render exactly as
// authored, with the item's per-block prop values applied.

import { useEffect, useState } from "react";
import { blockSampleProps, fetchBlocks, type Block } from "@/lib/backend";
import {
  fetchDcItem,
  groupByName,
  itemValuesRecord,
  loadGroupItems,
  loadGroups,
  type DcGroup,
  type DcItem,
  type DcPage,
  type VarType,
} from "@/lib/dc-catalogs";
import { blocksToResolver, type BlockResolver } from "@/lib/view-renderer";
import { ResolvedViewRenderer } from "@/lib/resolved-view";
import { setActiveProjectScope } from "@/lib/active-project";
import { localize, type Localized } from "@/lib/localized";

export interface RenderBlock {
  key: string;
  block: Block;
  props: Record<string, unknown>;
}

// Renders an ordered list of resolved blocks (a page's content).
export function CatalogBlocks({
  blocks,
  resolveBlock,
}: {
  blocks: RenderBlock[];
  resolveBlock: BlockResolver;
}) {
  return (
    <>
      {blocks.map((b) => (
        <ResolvedViewRenderer
          key={b.key}
          template={b.block.html}
          props={b.props}
          resolveBlock={resolveBlock}
        />
      ))}
    </>
  );
}

// Merge order: block sample defaults → template props → the item's overrides.
function mergeProps(
  block: Block,
  templateProps: Record<string, unknown>,
  override: Record<string, unknown> | undefined,
): Record<string, unknown> {
  return { ...blockSampleProps(block), ...templateProps, ...(override ?? {}) };
}

function buildPage(
  page: DcPage,
  blockById: Map<string, Block>,
  overridesByBlock: Map<string, Record<string, unknown>>,
): RenderBlock[] {
  return page.blocks
    .map((inst): RenderBlock | null => {
      const block = blockById.get(inst.blockId);
      if (!block) return null;
      return {
        key: inst.id,
        block,
        props: mergeProps(block, inst.props, overridesByBlock.get(inst.id)),
      };
    })
    .filter((b): b is RenderBlock => b !== null);
}

const overrideMap = (item: DcItem) =>
  new Map(item.pageProps.map((pp) => [pp.pageBlockId, pp.props]));

const isCardPage = (p: DcPage) => localize(p.pageName, "en").toLowerCase() === "card";

// The group's chosen card-view page (cardPageId), falling back to a page named
// "Card", then the first page — so a public group always renders *something*.
function cardPageOf(group: DcGroup | undefined): DcPage | undefined {
  if (!group) return undefined;
  return (
    (group.cardPageId && group.pages.find((p) => p.id === group.cardPageId)) ||
    group.pages.find(isCardPage) ||
    group.pages[0]
  );
}

// ── Explore: a card per item ─────────────────────────────────────────────────

export interface CatalogFilterDef {
  varName: string;
  type: VarType;
}

export interface CatalogCardEntry {
  id: string;
  title: string;
  popular: boolean;
  blocks: RenderBlock[];
  /** This item's extra-variable values, keyed by varName — drives filtering. */
  values: Record<string, Localized>;
}

export function useCatalogCards(catalog: string) {
  const [loading, setLoading] = useState(true);
  const [resolveBlock, setResolveBlock] = useState<BlockResolver>(() => () => null);
  const [cards, setCards] = useState<CatalogCardEntry[]>([]);
  const [filters, setFilters] = useState<CatalogFilterDef[]>([]);
  const [label, setLabel] = useState(catalog);

  useEffect(() => {
    let alive = true;
    // The public site is cross-project — read unscoped (all projects).
    setActiveProjectScope(undefined);
    Promise.all([
      fetchBlocks(),
      // Force-refresh groups so admin changes (filters, card page, public flag)
      // reflect here without a hard reload — the groups cache is memoized.
      loadGroups(true).then(() => groupByName(catalog)),
      loadGroupItems(catalog),
    ])
      .then(([blocks, group, items]) => {
        if (!alive) return;
        const blockById = new Map(blocks.map((b) => [b.id, b]));
        const cardPage = cardPageOf(group);
        const entries: CatalogCardEntry[] = items.map((item) => {
          const blocksForItem = cardPage
            ? buildPage(cardPage, blockById, overrideMap(item))
            : [];
          // The card's "Details" links to the item's detail page (group-aware).
          for (const b of blocksForItem) b.props.detailsUrl = `/explore/${catalog}/${item.id}`;
          const popular = Boolean(blocksForItem[0]?.props.popular);
          return {
            id: item.id,
            title: localize(item.title, "en"),
            popular,
            blocks: blocksForItem,
            values: itemValuesRecord(item),
          };
        });
        setResolveBlock(() => blocksToResolver(blocks));
        setCards(entries);
        setFilters(
          (group?.variables ?? [])
            .filter((v) => v.filterable)
            .map((v) => ({ varName: v.varName, type: v.type })),
        );
        setLabel(group?.info?.label ?? catalog);
        setLoading(false);
      })
      .catch((e) => {
        console.error("Failed to load catalog cards:", e);
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [catalog]);

  return { loading, resolveBlock, cards, filters, label };
}

// ── Detail: every non-Card page as a tab ─────────────────────────────────────

export interface DetailTab {
  id: string;
  title: Localized;
  blocks: RenderBlock[];
}

export function useProfessionDetail(id: string, catalog = "professions") {
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<DcItem | null>(null);
  const [tabs, setTabs] = useState<DetailTab[]>([]);
  const [resolveBlock, setResolveBlock] = useState<BlockResolver>(() => () => null);

  useEffect(() => {
    let alive = true;
    setActiveProjectScope(undefined); // public: read across all projects
    Promise.all([
      fetchDcItem(id),
      fetchBlocks(),
      loadGroups(true).then(() => groupByName(catalog)),
    ])
      .then(([dcItem, blocks, group]) => {
        if (!alive) return;
        const blockById = new Map(blocks.map((b) => [b.id, b]));
        const overrides = overrideMap(dcItem);
        const cardPageId = cardPageOf(group)?.id;
        const detailTabs: DetailTab[] = (group?.pages ?? [])
          .filter((p) => p.id !== cardPageId)
          .map((p) => ({
            id: p.id,
            title: p.pageName,
            blocks: buildPage(p, blockById, overrides),
          }));
        setItem(dcItem);
        setTabs(detailTabs);
        setResolveBlock(() => blocksToResolver(blocks));
        setLoading(false);
      })
      .catch((e) => {
        console.error("Failed to load profession detail:", e);
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, catalog]);

  return { loading, item, tabs, resolveBlock };
}
