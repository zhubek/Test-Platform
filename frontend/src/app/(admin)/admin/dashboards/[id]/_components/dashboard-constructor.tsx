"use client";

// Dashboard constructor — compose a project-level dashboard from DASHBOARD view
// blocks whose props bind to PROJECT-WIDE result variables (the union of
// license_test_variables across the project's tests). Same block-instance +
// prop-binding machinery as the Result View tab (Static rows with {{variables}}
// per cell, or Database). Preview values come from the last few completed
// attempts. Prototype: persists to localStorage per dashboard id (DB later).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Plus, Trash2, X } from "lucide-react";
import { fetchBlocks, fetchProjectAttempts, type Block, type ProjectAttempt } from "@/lib/backend";
import { ViewRenderer } from "@/lib/view-renderer";
import { useProject } from "@/lib/project-context";
import {
  modeOf,
  resolveBlockRef,
  resolveInstanceProps,
  type StoredValue,
} from "@/lib/question-instances";
import {
  attemptVars,
  dashboardScope,
  DASHBOARD_PRESETS,
  loadDashboard,
  saveDashboard,
  type DashboardBlockInstance,
} from "@/lib/dashboard-draft";
import { InstancePropEditor } from "@/components/instance-prop-editor";
import { type ExprVarGroup } from "@/components/prop-source";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function DashboardConstructor({ dashboardId }: { dashboardId: string }) {
  const { project } = useProject();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [attempts, setAttempts] = useState<ProjectAttempt[]>([]);
  const [items, setItems] = useState<DashboardBlockInstance[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [sample, setSample] = useState(8);
  const [loading, setLoading] = useState(true);
  const idRef = useRef(0);

  // DASHBOARD blocks library for the picker.
  useEffect(() => {
    fetchBlocks("DASHBOARD")
      .then(setBlocks)
      .catch((e) => console.error("Failed to load dashboard blocks:", e))
      .finally(() => setLoading(false));
  }, []);

  // Project-wide completed attempts → the variable source + preview values.
  useEffect(() => {
    if (!project.id) return;
    let active = true;
    fetchProjectAttempts(project.id)
      .then((a) => active && setAttempts(a))
      .catch((e) => console.error("Failed to load project attempts:", e));
    return () => {
      active = false;
    };
  }, [project.id]);

  // Saved layout (localStorage per dashboard); fall back to a starter preset.
  useEffect(() => {
    const saved = loadDashboard(dashboardId).blocks;
    setItems(saved.length ? saved : (DASHBOARD_PRESETS[dashboardId] ?? []));
  }, [dashboardId]);

  const save = useCallback(
    (next: DashboardBlockInstance[]) => {
      setItems(next);
      saveDashboard(dashboardId, { blocks: next });
    },
    [dashboardId],
  );

  // The variables a dashboard prop can reference: project result variables +
  // aggregates. Preview values come from the latest attempts.
  const resultVars = useMemo(() => attemptVars(attempts), [attempts]);
  const exprGroups: ExprVarGroup[] = useMemo(() => {
    const groups: ExprVarGroup[] = [];
    if (resultVars.length)
      groups.push({ label: "Result variables", items: resultVars.map((v) => ({ token: v.name, hint: v.hint })) });
    groups.push({
      label: "Aggregate",
      items: [
        { token: "count", hint: `${attempts.length} attempts` },
        { token: "recent", hint: "last attempts (rows)" },
      ],
    });
    return groups;
  }, [resultVars, attempts.length]);

  const scope = useMemo(() => dashboardScope(attempts, sample), [attempts, sample]);

  const blockById = useMemo(() => new Map(blocks.map((b) => [b.id, b])), [blocks]);

  // Self-heal block refs after a library re-seed (ids change, names survive).
  useEffect(() => {
    if (!blocks.length || !items.length) return;
    let changed = false;
    const healed = items.map((it) => {
      if (blockById.get(it.blockId)) {
        if (!it.blockName) {
          changed = true;
          return { ...it, blockName: blockById.get(it.blockId)!.name };
        }
        return it;
      }
      const byName = it.blockName ? blocks.find((b) => b.name === it.blockName) : undefined;
      if (byName) {
        changed = true;
        return { ...it, blockId: byName.id };
      }
      return it;
    });
    if (changed) save(healed);
  }, [blocks, items, blockById, save]);

  const uid = () => `db-${Date.now()}-${++idRef.current}`;

  const addBlock = (block: Block) => {
    const props: Record<string, StoredValue> = {};
    for (const p of block.props) props[p.name] = p.value;
    const id = uid();
    save([...items, { id, blockId: block.id, blockName: block.name, props }]);
    setPicking(false);
    setOpenId(id);
  };

  const patchProp = (id: string, name: string, value: StoredValue) =>
    save(items.map((it) => (it.id === id ? { ...it, props: { ...it.props, [name]: value } } : it)));

  const move = (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    save(next);
  };
  const duplicate = (i: number) => {
    const src = items[i];
    const copy = { ...src, id: uid(), props: { ...src.props } };
    const next = [...items];
    next.splice(i + 1, 0, copy);
    save(next);
  };
  const remove = (i: number) => save(items.filter((_, j) => j !== i));

  const open = openId ? items.find((it) => it.id === openId) : undefined;
  const openBlock = open ? resolveBlockRef(open, blocks) : undefined;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Constructor */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <span className="text-sm font-semibold">{open ? "Block" : "Dashboard"}</span>
          <span className="text-[0.7rem] text-muted-foreground">
            {items.length} block{items.length !== 1 && "s"} · {attempts.length} result
            {attempts.length !== 1 && "s"}
          </span>
        </div>

        <div className="max-h-[72vh] overflow-auto">
          {loading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Loading dashboard blocks…</p>
          ) : picking ? (
            <BlockPicker blocks={blocks} onPick={addBlock} onCancel={() => setPicking(false)} />
          ) : open && openBlock ? (
            <div>
              <div className="border-b px-3 py-2.5">
                <button
                  onClick={() => setOpenId(null)}
                  className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
                </button>
                <p className="text-sm font-semibold">{openBlock.name}</p>
              </div>
              <div className="space-y-4 p-4">
                {openBlock.props.map((p) => (
                  <InstancePropEditor
                    key={p.name}
                    def={p}
                    value={open.props[p.name]}
                    scope={scope}
                    groups={exprGroups}
                    onChange={(v) => patchProp(open.id, p.name, v)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {items.length === 0 && (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No blocks yet. Add a dashboard block and bind its props to result variables.
                </p>
              )}
              {items.map((it, i) => {
                const block = resolveBlockRef(it, blocks);
                const bound = Object.values(it.props).filter((v) => modeOf(v) !== "static").length;
                return (
                  <div
                    key={it.id}
                    className="group flex cursor-pointer items-center gap-3 rounded-lg border bg-background px-3 py-2.5 hover:border-teal-300"
                    onClick={() => block && setOpenId(it.id)}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {block?.name ?? (
                          <span className="rounded bg-amber-50 px-1 py-px font-medium text-amber-700">
                            block missing — re-add this block
                          </span>
                        )}
                      </p>
                      <p className="truncate text-[0.68rem] text-muted-foreground">
                        {block?.description || "Dashboard block"}
                        {bound > 0 && (
                          <span className="ml-1.5 rounded bg-teal-50 px-1 py-px font-medium text-teal-700">
                            {bound} bound
                          </span>
                        )}
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon-sm" onClick={() => move(i, -1)} title="Move up">
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => move(i, 1)} title="Move down">
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => duplicate(i)} title="Duplicate">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(i)}
                        title="Delete"
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              <Button variant="outline" size="sm" onClick={() => setPicking(true)} className="mt-1">
                <Plus className="mr-1 h-3.5 w-3.5" /> Add block
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Live preview */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <span className="text-sm font-medium text-muted-foreground">Live preview</span>
          <div className="ml-auto flex items-center gap-1.5 text-[0.66rem] text-muted-foreground">
            recent ={" "}
            <Input
              type="number"
              value={sample}
              onChange={(e) => setSample(Number(e.target.value) || 0)}
              className="h-6 w-14 text-xs"
            />
          </div>
        </div>
        <div className="max-h-[72vh] space-y-4 overflow-auto bg-gray-50/50 p-5">
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">The dashboard renders here.</p>
          ) : (
            items.map((it) => {
              const block = resolveBlockRef(it, blocks);
              if (!block) return null;
              const types = new Map(block.props.map((p) => [p.name, p.type]));
              const resolved = resolveInstanceProps(it, types, scope);
              return (
                <div
                  key={it.id}
                  className={cn("rounded-xl transition-shadow", openId === it.id && "ring-2 ring-teal-400/60")}
                  onClick={() => setOpenId(it.id)}
                >
                  <ViewRenderer template={block.html} props={resolved} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function BlockPicker({
  blocks,
  onPick,
  onCancel,
}: {
  blocks: Block[];
  onPick: (b: Block) => void;
  onCancel: () => void;
}) {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold">Pick a dashboard block</span>
        <Button variant="ghost" size="icon-sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {blocks.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => onPick(b)}
            className="rounded-lg border bg-background p-3 text-left transition-colors hover:border-teal-400 hover:bg-teal-50/40"
          >
            <p className="text-sm font-semibold">{b.name}</p>
            <p className="mt-0.5 line-clamp-2 text-[0.68rem] text-muted-foreground">{b.description || "—"}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
