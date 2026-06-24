"use client";

// "Pages" tab on a catalog ITEM. The group's Pages tab fixes the STRUCTURE
// (which blocks on which pages); here you fill in this item's PROP VALUES for
// those blocks. Unset props fall back to the block's sample defaults.
// Mirrors dc_catalog_page_props on the backend.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { blockSampleProps, fetchBlocks, type Block, type BlockProp, type BlockType } from "@/lib/backend";
import { blocksToResolver } from "@/lib/view-renderer";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { PropControl } from "@/app/(admin)/admin/blocks/_components/block-editor";
import { isCatalogRef } from "@/lib/catalog-refs";
import {
  ensureDefaultTemplates,
  fetchItemPageProps,
  setItemBlockProps,
  type CatalogPageBlock,
  type CatalogPageTemplate,
} from "@/lib/catalog-pages-api";
import { BoundBlockView } from "./bound-block-view";

const VIEW_TYPES: BlockType[] = ["CATALOG", "DASHBOARD", "RESULT"];

export function CatalogPagesTab({
  catalog,
  entityId,
}: {
  catalog: string;
  entityId: number | string;
}) {
  const { locale, t } = useLocale();
  const loc = locale as "en" | "ru" | "kk";
  const [pages, setPages] = useState<CatalogPageTemplate[]>([]);
  const [library, setLibrary] = useState<Block[]>([]);
  const [itemProps, setItemProps] = useState<Record<string, Record<string, unknown>>>({});
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetchBlocks()
      .then(async (all) => {
        const views = all.filter((b) => VIEW_TYPES.includes(b.type));
        setLibrary(views);
        setPages(await ensureDefaultTemplates(catalog, views));
      })
      .catch((e) => console.error("Failed to load block library:", e));
    fetchItemPageProps(catalog, entityId)
      .then(setItemProps)
      .catch((e) => console.error("Failed to load item props:", e));
  }, [catalog, entityId]);

  const blockById = useMemo(() => new Map(library.map((b) => [b.id, b])), [library]);
  const resolveBlock = useMemo(() => blocksToResolver(library), [library]);

  const setBlockProps = (blockInstanceId: string, props: Record<string, unknown>) => {
    setItemProps((all) => {
      const next = { ...all };
      if (Object.keys(props).length === 0) delete next[blockInstanceId];
      else next[blockInstanceId] = props;
      return next;
    });
    setItemBlockProps(catalog, entityId, blockInstanceId, props).catch((e) =>
      console.error("Failed to save item props:", e),
    );
  };

  const open = pages.find((p) => p.id === openId);

  // ── One page: props editor (left) + live preview (right) ─────────────────
  if (open) {
    return (
      <div>
        <button
          onClick={() => setOpenId(null)}
          className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-gray-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {localize(open.title, loc) || t("admin.catCfg.allPages")}
        </button>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-card">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <span className="text-sm font-semibold">{t("admin.catCfg.props")}</span>
              <span className="text-[0.7rem] text-muted-foreground">
                {t("admin.catCfg.itemValuesPerBlock")}
              </span>
            </div>
            <div className="max-h-[70vh] space-y-2 overflow-auto p-3">
              {open.blocks.map((inst) => (
                <ItemBlockCard
                  key={inst.id}
                  instance={inst}
                  block={blockById.get(inst.blockId)}
                  values={itemProps[inst.id] ?? {}}
                  onValuesChange={(props) => setBlockProps(inst.id, props)}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-card">
            <div className="border-b px-3 py-2 text-sm font-medium text-muted-foreground">
              {t("admin.catCfg.livePreview")}
            </div>
            <div className="max-h-[70vh] space-y-4 overflow-auto bg-gray-50/60 p-5">
              {open.blocks.map((inst) => {
                const block = blockById.get(inst.blockId);
                if (!block)
                  return (
                    <div key={inst.id} className="rounded-lg border border-dashed border-red-200 bg-red-50/40 px-4 py-3 text-xs text-red-400">
                      {t("admin.catCfg.blockNoLongerExists")}
                    </div>
                  );
                return (
                  <BoundBlockView
                    key={inst.id}
                    block={block}
                    instanceProps={{}}
                    overrides={itemProps[inst.id]}
                    scope={null}
                    resolveBlock={resolveBlock}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Pages list ─────────────────────────────────────────────────────────────
  return (
    <div>
      <p className="mb-4 text-xs text-gray-400">
        {t("admin.catCfg.itemPagesIntroPrefix")}{" "}
        <Link href={`/admin/catalogs#${catalog}`} className="text-teal-600 hover:underline">
          {t("admin.catCfg.groupPagesTabLink")}
        </Link>
        .
      </p>
      {pages.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center text-sm text-gray-400">
          {t("admin.catCfg.noPagesForItem")}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((p) => (
            <button
              key={p.id}
              onClick={() => setOpenId(p.id)}
              className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-teal-300 hover:bg-teal-50/30"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors group-hover:bg-teal-100 group-hover:text-teal-600">
                <FileText className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-gray-900">
                  {localize(p.title, loc) || t("admin.catCfg.untitledPage")}
                </span>
                <span className="mt-0.5 block text-xs text-gray-400">
                  {p.blocks.length}{" "}
                  {p.blocks.length === 1
                    ? t("admin.catCfg.blockCountOne")
                    : t("admin.catCfg.blockCountMany")}
                </span>
              </span>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-teal-500" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── One block: this item's prop values ──────────────────────────────────────
function ItemBlockCard({
  instance,
  block,
  values,
  onValuesChange,
}: {
  instance: CatalogPageBlock;
  block: Block | undefined;
  values: Record<string, unknown>;
  onValuesChange: (props: Record<string, unknown>) => void;
}) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(true);
  void instance;

  if (!block) {
    return (
      <div className="rounded-lg border border-dashed border-red-200 bg-red-50/40 px-3 py-2 text-xs text-red-400">
        {t("admin.catCfg.blockNoLongerExists")}
      </div>
    );
  }

  // Controls start from the block's sample values until this item sets its own.
  const sample = blockSampleProps(block);

  return (
    <div className="rounded-lg border bg-muted/40">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-1.5 px-2.5 py-2 text-left"
      >
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            !expanded && "-rotate-90",
          )}
        />
        <span className="truncate text-sm font-medium">{block.name}</span>
      </button>

      {expanded && (
        <div className="space-y-3 border-t bg-card px-3 py-3">
          {block.props.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("admin.catCfg.blockHasNoProps")}</p>
          ) : (
            block.props.map((def: BlockProp) => (
              <PropControl
                key={def.name}
                prop={{
                  name: def.name,
                  type: def.type,
                  value: values[def.name] ?? sample[def.name] ?? def.value,
                }}
                onChange={(value) => onValuesChange({ ...values, [def.name]: value })}
                fixedRefCatalog={
                  def.type === "ref" && isCatalogRef(def.value) ? def.value.$catalog : undefined
                }
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
