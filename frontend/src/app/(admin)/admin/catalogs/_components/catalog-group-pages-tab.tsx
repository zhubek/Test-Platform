"use client";

// "Pages" tab of a catalog GROUP: define the page STRUCTURE every item of this
// group renders with — create pages and pick blocks, nothing else. Prop VALUES
// are filled per item (its Pages tab); labels/titles are static in the block
// templates themselves.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronRight,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { fetchBlocks, type Block, type BlockType } from "@/lib/backend";
import { blocksToResolver, type BlockResolver } from "@/lib/view-renderer";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocalizedInput } from "./localized-input";
import { BoundBlockView } from "./bound-block-view";
import {
  ensureDefaultTemplates,
  pageItemId,
  savePageTemplates,
  type CatalogPageBlock,
  type CatalogPageTemplate,
} from "@/lib/catalog-pages-api";

const VIEW_TYPES: BlockType[] = ["CATALOG", "DASHBOARD", "RESULT"];

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

export function CatalogGroupPagesTab({ catalog }: { catalog: string }) {
  const { locale, t } = useLocale();
  const loc = locale as "en" | "ru" | "kk";
  const [pages, setPages] = useState<CatalogPageTemplate[]>([]);
  const [library, setLibrary] = useState<Block[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    fetchBlocks()
      .then(async (all) => {
        const views = all.filter((b) => VIEW_TYPES.includes(b.type));
        setLibrary(views);
        setPages(await ensureDefaultTemplates(catalog, views));
      })
      .catch((e) => console.error("Failed to load block library:", e));
  }, [catalog]);

  const blockById = useMemo(() => new Map(library.map((b) => [b.id, b])), [library]);
  const resolveBlock = useMemo(() => blocksToResolver(library), [library]);

  // Optimistic local update, then persist the full set; the server response
  // replaces local state so freshly created pages/blocks get their real ids.
  const persist = useCallback(
    (next: CatalogPageTemplate[]) => {
      setPages(next);
      savePageTemplates(catalog, next)
        .then(setPages)
        .catch((e) => console.error("Failed to save templates:", e));
    },
    [catalog],
  );

  const patchPage = useCallback(
    (pageId: string, patch: Partial<Omit<CatalogPageTemplate, "id">>) => {
      persist(pages.map((p) => (p.id === pageId ? { ...p, ...patch } : p)));
    },
    [pages, persist],
  );

  const addPage = async () => {
    const next = [
      ...pages,
      { id: pageItemId("page"), title: { en: "", ru: "", kk: "" }, blocks: [] },
    ];
    setPages(next);
    try {
      const saved = await savePageTemplates(catalog, next);
      setPages(saved);
      setOpenId(saved[saved.length - 1]?.id ?? null);
    } catch (e) {
      console.error("Failed to create page:", e);
    }
  };

  const removePage = (pageId: string) => {
    if (!confirm(t("admin.catCfg.deletePageConfirm"))) return;
    persist(pages.filter((p) => p.id !== pageId));
    if (openId === pageId) setOpenId(null);
  };

  const open = pages.find((p) => p.id === openId);

  // ── Page structure builder ────────────────────────────────────────────────
  if (open) {
    const setBlocks = (blocks: CatalogPageBlock[]) => patchPage(open.id, { blocks });

    const addBlock = (block: Block) => {
      setBlocks([...open.blocks, { id: pageItemId("blk"), blockId: block.id, props: {} }]);
      setPickerOpen(false);
    };

    const move = (i: number, dir: -1 | 1) => {
      const j = i + dir;
      if (j < 0 || j >= open.blocks.length) return;
      const next = [...open.blocks];
      [next[i], next[j]] = [next[j], next[i]];
      setBlocks(next);
    };

    return (
      <div>
        <button
          onClick={() => setOpenId(null)}
          className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-gray-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t("admin.catCfg.allPages")}
        </button>

        <div className="mb-4 max-w-md">
          <label className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wider text-gray-400">
            {t("admin.catCfg.pageTitle")}
          </label>
          <LocalizedInput
            value={open.title}
            onChange={(v) => patchPage(open.id, { title: v })}
            placeholder={t("admin.catCfg.pageTitle")}
            className={inputClass}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* ── Left: block list (structure only) ── */}
          <div className="rounded-xl border bg-card">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <span className="text-sm font-semibold">{t("admin.catCfg.blocks")}</span>
              <span className="text-[0.7rem] text-muted-foreground">
                {t("admin.catCfg.propValuesPerItem")}
              </span>
            </div>
            <div className="max-h-[70vh] space-y-2 overflow-auto p-3">
              {open.blocks.map((inst, i) => {
                const block = blockById.get(inst.blockId);
                return (
                  <div key={inst.id} className="flex items-center gap-1.5 rounded-lg border bg-muted/40 px-2.5 py-2">
                    {block ? (
                      <>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{block.name}</span>
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-muted-foreground">
                          {block.type.toLowerCase()}
                        </span>
                      </>
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-xs text-red-400">
                        {t("admin.catCfg.blockNoLongerExists")}
                      </span>
                    )}
                    <Button variant="ghost" size="icon-xs" onClick={() => move(i, -1)} disabled={i === 0} title={t("admin.catCfg.moveUp")}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => move(i, 1)}
                      disabled={i === open.blocks.length - 1}
                      title={t("admin.catCfg.moveDown")}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setBlocks(open.blocks.filter((b) => b.id !== inst.id))}
                      className="text-muted-foreground hover:text-red-500"
                      title={t("admin.catCfg.removeBlock")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
              <Button
                variant="outline"
                onClick={() => setPickerOpen(true)}
                className="h-auto w-full rounded-xl border-2 border-dashed py-3 text-muted-foreground hover:border-teal-300 hover:text-primary"
              >
                <Plus className="h-4 w-4" /> {t("admin.catCfg.addBlock")}
              </Button>
            </div>
          </div>

          {/* ── Right: preview with the blocks' sample data ── */}
          <div className="rounded-xl border bg-card">
            <div className="border-b px-3 py-2 text-sm font-medium text-muted-foreground">
              {t("admin.catCfg.preview")} <span className="text-[0.7rem]">{t("admin.catCfg.previewSampleNote")}</span>
            </div>
            <div className="max-h-[70vh] space-y-4 overflow-auto bg-gray-50/60 p-5">
              {open.blocks.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  {t("admin.catCfg.addBlocksToSeePage")}
                </p>
              ) : (
                open.blocks.map((inst) => {
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
                      scope={null}
                      resolveBlock={resolveBlock}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        <BlockPicker
          open={pickerOpen}
          library={library}
          resolveBlock={resolveBlock}
          onPick={addBlock}
          onClose={() => setPickerOpen(false)}
        />
      </div>
    );
  }

  // ── Pages list ────────────────────────────────────────────────────────────
  return (
    <div>
      <p className="mb-4 text-xs text-gray-400">
        {t("admin.catCfg.groupPagesIntro")}
      </p>
      {pages.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <p className="text-sm text-gray-400">
            {t("admin.catCfg.noPagesYet")}
          </p>
          <Button variant="outline" size="sm" onClick={addPage} className="mt-3">
            <Plus className="mr-1 h-4 w-4" /> {t("admin.catCfg.addFirstPage")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((p) => (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => setOpenId(p.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenId(p.id);
                }
              }}
              className="group flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-teal-300 hover:bg-teal-50/30"
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removePage(p.id);
                }}
                className="mt-1 shrink-0 text-gray-300 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
                title={t("admin.catCfg.deletePage")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-teal-500" />
            </div>
          ))}
          <button
            onClick={addPage}
            className="flex min-h-[72px] items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-400 transition-colors hover:border-teal-300 hover:text-teal-600"
          >
            <Plus className="h-4 w-4" /> {t("admin.catCfg.addPage")}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Library picker dialog ────────────────────────────────────────────────────
function BlockPicker({
  open,
  library,
  resolveBlock,
  onPick,
  onClose,
}: {
  open: boolean;
  library: Block[];
  resolveBlock: BlockResolver;
  onPick: (block: Block) => void;
  onClose: () => void;
}) {
  const { t } = useLocale();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("admin.catCfg.addABlock")}</DialogTitle>
          <DialogDescription>
            {t("admin.catCfg.blockPickerDescPrefix")}{" "}
            <Link href="/admin/blocks" className="text-primary underline">
              {t("admin.catCfg.blocksLink")}
            </Link>
            .
          </DialogDescription>
        </DialogHeader>
        {library.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("admin.catCfg.noViewBlocks")}
          </p>
        ) : (
          <div className="grid max-h-[60vh] gap-3 overflow-auto sm:grid-cols-2">
            {/* role=button (not <button>) — previewed blocks may contain their
                own buttons (e.g. the UNT chart switcher); button-in-button is
                invalid HTML. The preview is pointer-events-none, so a click
                anywhere on the card picks the block. */}
            {library.map((b) => (
              <div
                key={b.id}
                role="button"
                tabIndex={0}
                onClick={() => onPick(b)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPick(b);
                  }
                }}
                className="group cursor-pointer overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-colors hover:border-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="pointer-events-none relative h-28 overflow-hidden border-b bg-gray-50 p-2">
                  <div className="origin-top-left scale-[0.6]">
                    <BoundBlockView block={b} instanceProps={{}} scope={null} resolveBlock={resolveBlock} />
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="truncate text-sm font-semibold">{b.name}</h4>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {b.description || t("admin.catCfg.noDescription")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
