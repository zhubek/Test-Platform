"use client";

// Blocks library — reusable HTML+Tailwind components, grouped by where they are
// used (test / result / dashboard / catalog). Each block is a card you can
// open to edit, duplicate, or delete. "New block" creates a starter and opens
// the editor.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import {
  blockSampleProps,
  createBlock,
  deleteBlock,
  duplicateBlock,
  fetchBlocks,
  type Block,
  type BlockProp,
  type BlockType,
} from "@/lib/backend";
import { blocksToResolver } from "@/lib/view-renderer";
import { ResolvedViewRenderer } from "@/lib/resolved-view";
import { useProject } from "@/lib/project-context";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/button-link";
import { cn } from "@/lib/utils";

// One tab per block type. "Test" blocks are interactive answer-collectors; the
// other three are display blocks for their respective surface (test result page,
// data catalog, dashboard). Each tab filters the library to a single DB `type`.
type TabKey = "test" | "result" | "catalog" | "dashboard";

const TABS: { key: TabKey; label: string; type: BlockType }[] = [
  { key: "test", label: "Test", type: "TEST" },
  { key: "result", label: "Test Result", type: "RESULT" },
  { key: "catalog", label: "Catalog", type: "CATALOG" },
  { key: "dashboard", label: "Dashboard", type: "DASHBOARD" },
];

// The three display surfaces share one minimal starter; Test blocks need a widget.
const VIEW_STARTER: { html: string; props: BlockProp[] } = {
  html: `<div class="rounded-2xl border bg-white p-5 shadow-sm">
  <h3 class="text-lg font-bold text-gray-900">{{title}}</h3>
  <p class="mt-1 text-sm text-gray-500">{{body}}</p>
</div>`,
  props: [
    { name: "title", type: "text", value: "Title" },
    { name: "body", type: "text", value: "Body text" },
  ],
};

// A minimal starting point for a brand-new block on each surface.
const STARTER: Record<TabKey, { html: string; props: BlockProp[] }> = {
  test: {
    html: `<div class="rounded-2xl border bg-white p-6 shadow-sm">
  <h3 class="text-lg font-semibold text-gray-900">{{prompt}}</h3>
  <div class="mt-4">
    <widget name="single-choice" data-field="{{field}}" data-source="options"></widget>
  </div>
</div>`,
    props: [
      { name: "prompt", type: "text", value: "Your question here" },
      { name: "field", type: "text", value: "q1" },
      {
        name: "options",
        type: "json",
        value: [
          { text: "Option A", value: 1 },
          { text: "Option B", value: 2 },
          { text: "Option C", value: 3 },
        ],
      },
    ],
  },
  result: VIEW_STARTER,
  catalog: VIEW_STARTER,
  dashboard: VIEW_STARTER,
};

function propsObject(props: BlockProp[]): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const p of props) if (p.name) o[p.name] = p.value;
  return o;
}

export default function BlocksPage() {
  const router = useRouter();
  const { project } = useProject();
  const [tabKey, setTabKey] = useState<TabKey>("test");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [allBlocks, setAllBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const tab = TABS.find((t) => t.key === tabKey)!;
  // Thumbnails resolve nested <block name="…"> embeds against the full library.
  const resolveBlock = useMemo(() => blocksToResolver(allBlocks), [allBlocks]);

  const load = useCallback((type: BlockType) => {
    setLoading(true);
    // One fetch for the whole library; the active tab decides which type shows.
    fetchBlocks()
      .then((all) => {
        setAllBlocks(all);
        setBlocks(all.filter((b) => b.type === type));
      })
      .catch((e) => console.error("Failed to load blocks:", e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!project.id) return; // wait for the active project; blocks are project-scoped
    const t = TABS.find((x) => x.key === tabKey)!;
    load(t.type);
  }, [tabKey, load, project.id]);

  const createNew = async () => {
    setBusy(true);
    try {
      const block = await createBlock({
        type: tab.type,
        name: "Untitled block",
        description: "",
        html: STARTER[tab.key].html,
        props: STARTER[tab.key].props,
        sampleProps: propsObject(STARTER[tab.key].props),
      });
      router.push(`/admin/blocks/${block.id}`);
    } catch (e) {
      console.error("Failed to create block:", e);
      setBusy(false);
    }
  };

  const onDuplicate = async (id: string) => {
    setBusy(true);
    try {
      await duplicateBlock(id);
      load(tab.type);
    } catch (e) {
      console.error("Failed to duplicate block:", e);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string, name: string) => {
    if (!confirm(`Delete “${name}”? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteBlock(id);
      setBlocks((bs) => bs.filter((b) => b.id !== id));
    } catch (e) {
      console.error("Failed to delete block:", e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blocks</h1>
          <p className="text-sm text-muted-foreground">
            Reusable components built in HTML + Tailwind, organized by where they
            are used: tests, test results, catalogs, and dashboards.
          </p>
        </div>
        <Button onClick={createNew} disabled={busy}>
          <Plus className="mr-1 h-4 w-4" /> New {tab.label.toLowerCase()} block
        </Button>
      </div>

      {/* Surface tabs */}
      <div className="mb-5 inline-flex rounded-lg border bg-card p-0.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTabKey(t.key)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              tabKey === t.key
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Loading blocks…</div>
      ) : blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">No {tab.label.toLowerCase()} blocks yet.</p>
          <Button variant="outline" size="sm" onClick={createNew} disabled={busy} className="mt-3">
            <Plus className="mr-1 h-4 w-4" /> Create the first one
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {blocks.map((b) => (
            <div key={b.id} className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
              {/* Live thumbnail */}
              <div className="relative h-40 overflow-hidden border-b bg-gray-50 p-3">
                <div className="pointer-events-none origin-top-left scale-[0.8]">
                  <ResolvedViewRenderer template={b.html} props={blockSampleProps(b)} resolveBlock={resolveBlock} />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="truncate font-semibold text-gray-900">{b.name}</h3>
                <p className="mt-0.5 line-clamp-2 flex-1 text-xs text-muted-foreground">
                  {b.description || "No description"}
                </p>
                <div className="mt-3 flex items-center gap-1">
                  <ButtonLink
                    href={`/admin/blocks/${b.id}`}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </ButtonLink>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDuplicate(b.id)}
                    disabled={busy}
                    title="Duplicate"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDelete(b.id, b.name)}
                    disabled={busy}
                    title="Delete"
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
