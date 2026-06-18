"use client";

// "Questions · Blocks" — the questions constructor rebuilt on top of the block
// library. A question is an INSTANCE of a TEST block: the block owns the markup
// and widget; the instance owns the values — prompt text, answer variable,
// options — and, when a prop should come from data, its mapping (database query
// or runtime-context path). Mappings live here on instances, never on blocks.
// Prompt texts support inline {{variables}} via the insert menu.
//
// Questions persist to the DB: each is a TestBlock row on the QUESTION surface
// (props + advancedParams), and the declared variables live on the test's
// advancedParams.vars. Edits debounce-save. Database SOURCES inside props are
// still the mock registry (@/lib/mock-sources) — that part stays a prototype.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Eye, Plus, Trash2, X } from "lucide-react";
import {
  fetchBlocks,
  fetchTest,
  fetchTestBlocks,
  saveTestBlocks,
  updateTest,
  type AdminTestBlock,
  type Block,
  type BlockProp,
  type TestBlockInput,
} from "@/lib/backend";
import { ViewRenderer } from "@/lib/view-renderer";
import { evaluate, resolvePath, validate } from "@/lib/view-expr";
import {
  modeOf,
  resolveBlockRef,
  resolveInstanceProps,
  type Assign,
  type QuestionInstance,
  type StoredValue,
  type TestVar,
} from "@/lib/question-instances";
import { ButtonLink } from "@/components/button-link";
import {
  TEST_CONTEXT_PATHS,
  TEST_SAMPLE_CONTEXT,
  emptyDbBinding,
  type DbBinding,
} from "@/lib/mock-sources";
import { Switch } from "@/components/ui/switch";
import {
  CtxEditor,
  DbEditor,
  ExprInput,
  ModeToggle,
  RowsPreview,
  type ExprVarGroup,
  type PropMode,
} from "@/components/prop-source";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-context";
import { useContentLanguages } from "@/lib/project-context";
import type { Locale } from "@/lib/i18n";
import { localizeLoose, type Localized } from "@/lib/localized";

type VarItem = { token: string; hint: string };

export function BlocksQuestionsTab({ testId }: { testId?: string }) {
  const { locale } = useLocale();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<QuestionInstance[]>([]);
  const [vars, setVars] = useState<TestVar[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const idRef = useRef(0);
  // Full advancedParams bag from the DB — the JSON column is replaced wholesale
  // on save, so we keep the other keys (calc, result, visibilityRule) to merge
  // back when only `vars` change.
  const apBaseRef = useRef<Record<string, unknown>>({});
  // Becomes true after the initial DB load; guards saves so a mount-time render
  // can never PUT an empty list and wipe the surface.
  const loadedRef = useRef(false);

  // ── DB mapping ─────────────────────────────────────────────────────────────
  const dbToInstance = (b: AdminTestBlock): QuestionInstance => {
    const ap = (b.advancedParams ?? {}) as {
      onAnswer?: Assign[];
      visibleIf?: string;
      randomize?: boolean;
    };
    return {
      id: b.id,
      blockId: b.blockId,
      blockName: b.block?.name,
      props: (b.props ?? {}) as Record<string, StoredValue>,
      randomize: ap.randomize,
      visibleIf: ap.visibleIf,
      onAnswer: ap.onAnswer,
    };
  };

  const instanceToInput = (it: QuestionInstance): TestBlockInput => {
    const advancedParams: Record<string, unknown> = {};
    if (it.onAnswer?.some((a) => a.target.trim())) advancedParams.onAnswer = it.onAnswer;
    if (it.visibleIf?.trim()) advancedParams.visibleIf = it.visibleIf;
    if (it.randomize) advancedParams.randomize = true;
    return { blockId: it.blockId, props: it.props, advancedParams };
  };

  // ── Load: TEST library + this test's QUESTION blocks + declared variables ────
  useEffect(() => {
    if (!testId) {
      setLoading(false);
      loadedRef.current = true;
      return;
    }
    let active = true;
    setLoading(true);
    loadedRef.current = false;
    Promise.all([fetchBlocks("TEST"), fetchTest(testId), fetchTestBlocks(testId, "QUESTION")])
      .then(([lib, test, tbs]) => {
        if (!active) return;
        setBlocks(lib);
        apBaseRef.current = test.advancedParams ?? {};
        const rawVars = (test.advancedParams as { vars?: unknown })?.vars;
        setVars(
          Array.isArray(rawVars)
            ? rawVars.map((v) => ({
                name: String((v as TestVar).name ?? ""),
                initial: String((v as TestVar).initial ?? "0"),
              }))
            : [],
        );
        setItems(tbs.map(dbToInstance));
        loadedRef.current = true;
      })
      .catch((e) => console.error("Failed to load questions:", e))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [testId]);

  // ── Debounced persistence to the DB ──────────────────────────────────────────
  const blocksTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const varsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (next: QuestionInstance[]) => {
      setItems(next);
      if (!testId || !loadedRef.current) return;
      if (blocksTimer.current) clearTimeout(blocksTimer.current);
      blocksTimer.current = setTimeout(() => {
        saveTestBlocks(testId, "QUESTION", next.map(instanceToInput)).catch((e) =>
          console.error("Failed to save questions:", e),
        );
      }, 600);
    },
    [testId],
  );

  const saveVars = useCallback(
    (next: TestVar[]) => {
      setVars(next);
      if (!testId || !loadedRef.current) return;
      if (varsTimer.current) clearTimeout(varsTimer.current);
      varsTimer.current = setTimeout(() => {
        updateTest(testId, { advancedParams: { ...apBaseRef.current, vars: next } })
          .then((t) => {
            apBaseRef.current = t.advancedParams ?? {};
          })
          .catch((e) => console.error("Failed to save variables:", e));
      }, 600);
    },
    [testId],
  );

  const blockById = useMemo(() => new Map(blocks.map((b) => [b.id, b])), [blocks]);

  // Self-heal drafts after a library re-seed: block ids change but names
  // survive — re-point stale blockIds by name, and backfill missing names.
  useEffect(() => {
    if (!blocks.length || !items.length) return;
    let changed = false;
    const healed = items.map((it) => {
      const byId = blockById.get(it.blockId);
      if (byId) {
        if (!it.blockName) {
          changed = true;
          return { ...it, blockName: byId.name };
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

  // Answer variables (each question's `field` prop).
  const fieldVars = useMemo(
    () =>
      items
        .map((it) => it.props.field)
        .filter((f): f is string => typeof f === "string" && f.trim() !== ""),
    [items],
  );

  // Variables assigned by "after answered" operations.
  const assignTargets = useMemo(
    () => items.flatMap((it) => (it.onAnswer ?? []).map((a) => a.target.trim())).filter(Boolean),
    [items],
  );

  // Preview scope: the test-time context (viewer, page filters, today — no
  // result.*, which doesn't exist while taking a test) + declared variables at
  // their initial values + a visible placeholder per answer variable.
  const previewScope = useMemo(() => {
    const scope: Record<string, unknown> = { ...TEST_SAMPLE_CONTEXT };
    for (const v of vars) {
      const name = v.name.trim();
      if (!name) continue;
      const n = Number(v.initial);
      scope[name] = v.initial.trim() === "" ? 0 : Number.isFinite(n) ? n : v.initial;
    }
    for (const t of assignTargets) if (!(t in scope)) scope[t] = 0;
    for (const f of fieldVars) scope[f] = `«${f}»`;
    return scope;
  }, [vars, assignTargets, fieldVars]);

  // Everything insertable as a variable, with its preview value as the hint.
  const varItems = useMemo<VarItem[]>(() => {
    const names = [...new Set([...vars.map((v) => v.name.trim()), ...assignTargets, ...fieldVars])].filter(Boolean);
    return names.map((n) => ({ token: n, hint: String(previewScope[n] ?? "") }));
  }, [vars, assignTargets, fieldVars, previewScope]);

  const addQuestion = (block: Block) => {
    const props: Record<string, StoredValue> = {};
    for (const p of block.props) props[p.name] = p.value;
    const id = `q-${Date.now()}-${++idRef.current}`;
    save([...items, { id, blockId: block.id, blockName: block.name, props }]);
    setPicking(false);
    setOpenId(id);
  };

  const patchProp = (qid: string, name: string, value: StoredValue) =>
    save(items.map((it) => (it.id === qid ? { ...it, props: { ...it.props, [name]: value } } : it)));

  const patchItem = (qid: string, partial: Partial<QuestionInstance>) =>
    save(items.map((it) => (it.id === qid ? { ...it, ...partial } : it)));

  const move = (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    save(next);
  };

  const duplicate = (i: number) => {
    const src = items[i];
    const copy: QuestionInstance = {
      ...src,
      id: `q-${Date.now()}-${++idRef.current}`,
      props: { ...src.props },
    };
    const next = [...items];
    next.splice(i + 1, 0, copy);
    save(next);
  };

  const remove = (i: number) => save(items.filter((_, j) => j !== i));

  const open = openId ? items.find((it) => it.id === openId) : undefined;
  const openBlock = open ? resolveBlockRef(open, blocks) : undefined;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* ── Left: constructor ── */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <span className="text-sm font-semibold">Constructor</span>
          <span className="text-[0.7rem] text-muted-foreground">
            {items.length} question{items.length !== 1 && "s"} · built from blocks
          </span>
          {testId != null && (
            <ButtonLink
              variant="outline"
              size="sm"
              href={`/admin/tests/${testId}/preview-blocks`}
              target="_blank"
              rel="noreferrer"
              className="ml-auto h-7"
            >
              <Eye className="mr-1 h-3.5 w-3.5" /> Preview
            </ButtonLink>
          )}
        </div>

        <div className="max-h-[70vh] overflow-auto">
          {loading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Loading block library…</p>
          ) : picking ? (
            <BlockPicker blocks={blocks} onPick={addQuestion} onCancel={() => setPicking(false)} />
          ) : open && openBlock ? (
            <InstanceEditor
              block={openBlock}
              item={open}
              index={items.findIndex((it) => it.id === open.id)}
              varItems={varItems.filter((v) => v.token !== open.props.field)}
              scope={previewScope}
              onPatchProp={(name, v) => patchProp(open.id, name, v)}
              onPatchItem={(partial) => patchItem(open.id, partial)}
              onBack={() => setOpenId(null)}
            />
          ) : (
            <div className="space-y-2 p-4">
              <VarsPanel vars={vars} onChange={saveVars} />
              {items.length === 0 && (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No questions yet. Add one from the block library.
                </p>
              )}
              {items.map((it, i) => {
                const block = resolveBlockRef(it, blocks);
                const prompt = localizeLoose(it.props.prompt as never, locale);
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
                        {prompt || <span className="italic text-muted-foreground">Untitled question</span>}
                      </p>
                      <p className="truncate text-[0.68rem] text-muted-foreground">
                        {block?.name ?? (
                          <span className="rounded bg-amber-50 px-1 py-px font-medium text-amber-700">
                            block missing — the library changed; delete and re-add this question
                          </span>
                        )}
                        {typeof it.props.field === "string" && it.props.field && (
                          <>
                            {" · "}
                            <code className="font-mono">{it.props.field}</code>
                          </>
                        )}
                        {bound > 0 && (
                          <span className="ml-1.5 rounded bg-teal-50 px-1 py-px font-medium text-teal-700">
                            {bound} mapped
                          </span>
                        )}
                        {it.visibleIf?.trim() && (
                          <span className="ml-1.5 rounded bg-violet-50 px-1 py-px font-medium text-violet-700">
                            visible if
                          </span>
                        )}
                        {(it.onAnswer?.filter((a) => a.target.trim()).length ?? 0) > 0 && (
                          <span className="ml-1.5 rounded bg-amber-50 px-1 py-px font-medium text-amber-700">
                            {it.onAnswer!.filter((a) => a.target.trim()).length} op
                            {it.onAnswer!.filter((a) => a.target.trim()).length > 1 ? "s" : ""}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
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
                <Plus className="mr-1 h-3.5 w-3.5" /> Add question
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: live preview ── */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-3 py-2 text-sm font-medium text-muted-foreground">Live preview</div>
        <div className="max-h-[70vh] space-y-4 overflow-auto bg-gray-50/50 p-5">
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Questions will render here.</p>
          ) : (
            items.map((it, i) => {
              const block = resolveBlockRef(it, blocks);
              if (!block) {
                return (
                  <div key={it.id} className="rounded-xl border border-dashed border-amber-300 bg-amber-50/40 p-4 text-center text-xs text-amber-700">
                    Q{i + 1}: its block is missing from the library — delete and re-add the question.
                  </div>
                );
              }
              const types = new Map(block.props.map((p) => [p.name, p.type]));
              const resolved = resolveInstanceProps(it, types, previewScope, { locale });
              // visibleIf simulated against the initial variable values: a
              // hidden question stays visible in the editor, just dimmed.
              const hidden = it.visibleIf?.trim() ? !evaluate(it.visibleIf, previewScope) : false;
              return (
                <div
                  key={it.id}
                  className={cn("rounded-xl transition-shadow", openId === it.id && "ring-2 ring-teal-400/60")}
                  onClick={() => setOpenId(it.id)}
                >
                  <div className="mb-1 flex items-baseline gap-2 px-1">
                    <span className="text-[0.65rem] font-semibold text-muted-foreground">Q{i + 1}</span>
                    {hidden && (
                      <span className="rounded bg-violet-50 px-1 py-px text-[0.62rem] font-medium text-violet-700">
                        hidden by visible-if (with initial values)
                      </span>
                    )}
                  </div>
                  <div className={cn(hidden && "opacity-40")}>
                    <ViewRenderer template={block.html} props={resolved} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Variables panel — declare test variables with initial values. They are
// available in every expression and updated by "after answered" operations.

function VarsPanel({ vars, onChange }: { vars: TestVar[]; onChange: (v: TestVar[]) => void }) {
  const set = (i: number, patch: Partial<TestVar>) =>
    onChange(vars.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">Variables</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-[0.68rem] text-primary hover:text-teal-700"
          onClick={() => onChange([...vars, { name: "", initial: "0" }])}
        >
          <Plus className="h-3 w-3" /> Add variable
        </Button>
      </div>
      {vars.length === 0 ? (
        <p className="text-[0.66rem] text-muted-foreground">
          Declared once, usable in every expression, updated by question operations (e.g.{" "}
          <code className="font-mono">score</code>, <code className="font-mono">riasec_R</code>).
        </p>
      ) : (
        <div className="space-y-1.5">
          {vars.map((v, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Input
                value={v.name}
                placeholder="name"
                onChange={(e) => set(i, { name: e.target.value })}
                className="h-7 w-36 bg-card font-mono text-xs"
              />
              <span className="text-xs text-muted-foreground">=</span>
              <Input
                value={v.initial}
                placeholder="initial value"
                onChange={(e) => set(i, { initial: e.target.value })}
                className="h-7 w-28 bg-card font-mono text-xs"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-red-500"
                onClick={() => onChange(vars.filter((_, j) => j !== i))}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Block picker — choose which question type (block) to instantiate.

function BlockPicker({ blocks, onPick, onCancel }: { blocks: Block[]; onPick: (b: Block) => void; onCancel: () => void }) {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold">Pick a question block</span>
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

// --------------------------------------------------------------------------
// Instance editor — per-prop values and mappings for one question.

function InstanceEditor({
  block,
  item,
  index,
  varItems,
  scope,
  onPatchProp,
  onPatchItem,
  onBack,
}: {
  block: Block;
  item: QuestionInstance;
  index: number;
  varItems: VarItem[];
  scope: Record<string, unknown>;
  onPatchProp: (name: string, v: StoredValue) => void;
  onPatchItem: (partial: Partial<QuestionInstance>) => void;
  onBack: () => void;
}) {
  const hasChoices = block.props.some((p) => p.type === "json" || p.type === "list");
  // Groups for bare-expression inputs (conditions, operations).
  const condGroups: ExprVarGroup[] = [
    ...(varItems.length ? [{ label: "Variables", items: varItems }] : []),
    {
      label: "Context",
      items: TEST_CONTEXT_PATHS.map((p) => ({ token: p, hint: String(resolvePath(p, TEST_SAMPLE_CONTEXT) ?? "") })),
    },
  ];
  const opGroups: ExprVarGroup[] = [
    { label: "Answer", items: [{ token: "answer", hint: "the selected value" }] },
    ...condGroups,
  ];
  const opScope = { ...scope, answer: 1 }; // preview operations as if answer = 1
  return (
    <div>
      <div className="border-b px-3 py-2.5">
        <button
          onClick={onBack}
          className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Questions
        </button>
        <p className="text-sm font-semibold">
          Q{index + 1} · {block.name}
        </p>
      </div>
      <div className="space-y-4 p-4">
        {block.props.map((p) => (
          <PropEditor
            key={p.name}
            def={p}
            value={item.props[p.name]}
            varItems={varItems}
            scope={scope}
            onChange={(v) => onPatchProp(p.name, v)}
          />
        ))}

        {hasChoices && (
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[0.78rem] font-medium text-foreground">Randomize options</p>
              <p className="text-[0.66rem] text-muted-foreground">
                Shuffle the order options appear for each respondent.
              </p>
            </div>
            <Switch checked={!!item.randomize} onCheckedChange={(c) => onPatchItem({ randomize: c })} />
          </div>
        )}

        {/* After answered — variable operations */}
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
            After answered — operations
          </label>
          <p className="mb-1.5 text-[0.64rem] leading-relaxed text-muted-foreground">
            Run when the respondent answers. <code className="font-mono">answer</code> is the selected value
            (option value, scale point, text). e.g. <code className="font-mono">score = score + answer</code>.
          </p>
          <div className="space-y-1.5">
            {(item.onAnswer ?? []).map((a, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <Input
                  value={a.target}
                  placeholder="variable"
                  onChange={(e) =>
                    onPatchItem({ onAnswer: item.onAnswer!.map((x, j) => (j === i ? { ...x, target: e.target.value } : x)) })
                  }
                  className="h-8 w-32 font-mono text-xs"
                />
                <span className="mt-1.5 text-xs text-muted-foreground">=</span>
                <div className="min-w-0 flex-1">
                  <ExprInput
                    bare
                    value={a.expr}
                    scope={opScope}
                    groups={opGroups}
                    placeholder="score + answer"
                    onChange={(expr) =>
                      onPatchItem({ onAnswer: item.onAnswer!.map((x, j) => (j === i ? { ...x, expr } : x)) })
                    }
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-red-500"
                  onClick={() => onPatchItem({ onAnswer: item.onAnswer!.filter((_, j) => j !== i) })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[0.68rem] text-primary hover:text-teal-700"
              onClick={() => onPatchItem({ onAnswer: [...(item.onAnswer ?? []), { target: "", expr: "" }] })}
            >
              <Plus className="h-3 w-3" /> Add operation
            </Button>
          </div>
        </div>

        {/* Visibility condition */}
        <div>
          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Visible if
          </label>
          <ExprInput
            bare
            value={item.visibleIf ?? ""}
            scope={scope}
            groups={condGroups}
            placeholder="score >= 3 && interest == 2"
            onChange={(v) => onPatchItem({ visibleIf: v || undefined })}
          />
          <p className="mt-1 text-[0.64rem] text-muted-foreground">
            The question shows only when this is true — reference any variable. Empty = always visible.
          </p>
        </div>
      </div>
    </div>
  );
}

function PropEditor({
  def,
  value,
  varItems,
  scope,
  onChange,
}: {
  def: BlockProp;
  value: StoredValue;
  varItems: VarItem[];
  scope: Record<string, unknown>;
  onChange: (v: StoredValue) => void;
}) {
  const mode = modeOf(value);
  // Only data props (options, rows…) get source tabs: Static rows, an
  // Expression that generates the list, or a Database query. Text props don't
  // need tabs at all — inline {{expressions}} cover references and logic.
  const isCollection = def.type === "json" || def.type === "list";

  // The field names this block's template reads, taken from its sample rows —
  // used to pre-seed the database mapping (e.g. options → text, value).
  const first = Array.isArray(def.value) ? def.value[0] : undefined;
  const expects = first && typeof first === "object" ? Object.keys(first as object) : [];

  const setMode = (m: PropMode) => {
    if (m === mode) return;
    if (m === "db") onChange({ $db: emptyDbBinding() });
    else if (m === "expr") onChange({ $expr: "" });
    else onChange(def.value); // back to the block's sample value
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="block text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {def.name}
        </label>
        {isCollection && <ModeToggle mode={mode} onChange={setMode} modes={["static", "db"]} />}
      </div>

      {mode === "db" && (
        <DbEditor
          binding={(value as { $db: DbBinding }).$db}
          scalar={!isCollection}
          expects={expects}
          onChange={(b) => onChange({ $db: b })}
        />
      )}
      {mode === "expr" && (
        // Legacy drafts only — generated lists now live in mapping expressions
        // (or a row-generating source); the tab itself was removed.
        <ExprEditor expr={(value as { $expr: string }).$expr} scope={scope} onChange={(e) => onChange({ $expr: e })} />
      )}
      {mode === "ctx" && (
        // Legacy drafts only — context now lives in inline expressions.
        <CtxEditor path={(value as { $ctx: string }).$ctx} onChange={(p) => onChange({ $ctx: p })} />
      )}
      {mode === "static" && (
        <StaticEditor def={def} value={value} varItems={varItems} scope={scope} onChange={onChange} />
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Expression mode for collections — one expression that generates the rows.
// e.g. range(1, 10) for a numeric scale, top(result.scales, 3) for the
// viewer's strongest scales.

function ExprEditor({
  expr,
  scope,
  onChange,
}: {
  expr: string;
  scope: Record<string, unknown>;
  onChange: (e: string) => void;
}) {
  const error = expr.trim() ? validate(expr) : null;
  const result = expr.trim() && !error ? evaluate(expr, scope) : undefined;
  const rows = Array.isArray(result)
    ? result.map((r) => (r && typeof r === "object" ? (r as Record<string, unknown>) : { value: r }))
    : null;

  return (
    <div className="space-y-1.5 rounded-lg border bg-muted/30 p-2.5">
      <textarea
        value={expr}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        placeholder="range(1, 10)"
        className="h-16 w-full resize-y rounded-md border bg-card p-2 font-mono text-[0.72rem] leading-relaxed outline-none focus:border-ring"
      />
      {error ? (
        <p className="text-[0.66rem] text-red-500">{error}</p>
      ) : rows ? (
        <RowsPreview rows={rows} />
      ) : result !== undefined ? (
        <p className="text-[0.66rem] text-muted-foreground">
          → <span className="text-foreground/80">{JSON.stringify(result)}</span>{" "}
          <span className="text-amber-600/90">(not a list — this prop expects rows)</span>
        </p>
      ) : (
        <p className="text-[0.66rem] text-muted-foreground">
          One expression that returns the rows. Try{" "}
          <code className="font-mono">range(1, 10)</code> · <code className="font-mono">top(result.scales, 3)</code>
        </p>
      )}
    </div>
  );
}

function StaticEditor({
  def,
  value,
  varItems,
  scope,
  onChange,
}: {
  def: BlockProp;
  value: StoredValue;
  varItems: VarItem[];
  scope: Record<string, unknown>;
  onChange: (v: StoredValue) => void;
}) {
  if (def.type === "text") {
    return <LocalizedVarText value={value} varItems={varItems} scope={scope} onChange={onChange} />;
  }
  if (def.type === "number") {
    return (
      <Input
        type="number"
        value={String(value ?? "")}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-8 w-32"
      />
    );
  }
  if (def.type === "json" && isOptionsArray(value)) {
    return (
      <OptionsEditor
        value={value as OptionRow[]}
        varItems={varItems}
        scope={scope}
        onChange={onChange}
      />
    );
  }
  if (def.type === "json" || def.type === "list") {
    return <JsonTextarea value={value} onChange={onChange} />;
  }
  // color / boolean fall back to a plain text input in this prototype
  return (
    <Input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className="h-8" />
  );
}

// --------------------------------------------------------------------------
// Text with inline expressions — the shared ExprInput, fed with this surface's
// variables: answer variables (other questions' fields) + the test-time
// context (viewer, filters, today).

function VarTextInput({
  value,
  varItems,
  scope,
  onChange,
}: {
  value: string;
  varItems: VarItem[];
  scope: Record<string, unknown>;
  onChange: (v: string) => void;
}) {
  const groups: ExprVarGroup[] = [
    ...(varItems.length ? [{ label: "Variables", items: varItems }] : []),
    {
      label: "Context",
      items: TEST_CONTEXT_PATHS.map((p) => ({
        token: p,
        hint: String(resolvePath(p, TEST_SAMPLE_CONTEXT) ?? ""),
      })),
    },
  ];
  return <ExprInput value={value} onChange={onChange} scope={scope} groups={groups} />;
}

// --------------------------------------------------------------------------
// Per-language text prop. Wraps VarTextInput (so inline {{variables}} still
// work) with a kk/ru/en switch; the stored value is a Localized map. A legacy
// plain string is read as the English entry, so old drafts keep working.

function asLocalizedMap(v: StoredValue): Localized {
  if (v && typeof v === "object" && !Array.isArray(v)) return { ...(v as Record<string, string>) };
  if (typeof v === "string") return v ? { en: v } : {};
  return {};
}

function LocalizedVarText({
  value,
  varItems,
  scope,
  onChange,
}: {
  value: StoredValue;
  varItems: VarItem[];
  scope: Record<string, unknown>;
  onChange: (v: Localized) => void;
}) {
  const map = asLocalizedMap(value);
  const { codes, default: defaultLang } = useContentLanguages();
  const [lang, setLang] = useState<Locale>(defaultLang);
  const activeLang = codes.includes(lang) ? lang : codes[0];
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-0.5">
        {codes.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className={cn(
              "rounded px-1.5 py-0.5 text-[0.6rem] font-bold uppercase transition-colors",
              activeLang === l ? "bg-primary/10 text-primary" : "text-muted-foreground/40 hover:text-muted-foreground",
            )}
          >
            {l}
            {!map[l] && <span className="ml-0.5 inline-block h-1 w-1 rounded-full bg-amber-400 align-middle" />}
          </button>
        ))}
      </div>
      <VarTextInput
        value={map[activeLang] ?? ""}
        varItems={varItems}
        scope={scope}
        onChange={(t) => onChange({ ...map, [activeLang]: String(t) })}
      />
    </div>
  );
}

// --------------------------------------------------------------------------
// Options editor — choice text + scoring value rows (the question's options).

function isOptionsArray(v: StoredValue): boolean {
  return Array.isArray(v) && v.every((o) => o && typeof o === "object" && "text" in (o as object));
}

type OptionRow = { text: StoredValue; value: number };

function OptionsEditor({
  value,
  varItems,
  scope,
  onChange,
}: {
  value: OptionRow[];
  varItems: VarItem[];
  scope: Record<string, unknown>;
  onChange: (v: StoredValue) => void;
}) {
  const set = (i: number, patch: Partial<OptionRow>) =>
    onChange(value.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  return (
    <div className="space-y-1.5">
      {value.map((o, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[0.62rem] font-semibold text-muted-foreground">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <LocalizedVarText value={o.text} varItems={varItems} scope={scope} onChange={(t) => set(i, { text: t })} />
          </div>
          <Input
            type="number"
            value={String(o.value ?? "")}
            onChange={(e) => set(i, { value: Number(e.target.value) || 0 })}
            title="Scoring value"
            className="h-8 w-16 text-center font-mono text-xs"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="shrink-0 text-muted-foreground hover:text-red-500"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange([...value, { text: "", value: value.length + 1 }])}
        className="h-6 px-1.5 text-[0.68rem] text-primary hover:text-teal-700"
      >
        <Plus className="h-3 w-3" /> Add option
      </Button>
    </div>
  );
}

// Free-form JSON fallback for non-options collections.
function JsonTextarea({ value, onChange }: { value: StoredValue; onChange: (v: StoredValue) => void }) {
  const [text, setText] = useState(() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "[]";
    }
  });
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <textarea
        value={text}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          try {
            onChange(JSON.parse(e.target.value));
            setError(null);
          } catch (err) {
            setError((err as Error).message);
          }
        }}
        className="h-32 w-full resize-y rounded-md border bg-gray-50 p-2 font-mono text-[0.72rem] leading-relaxed outline-none focus:border-ring"
      />
      {error && <p className="mt-1 text-[0.66rem] text-red-500">Invalid JSON: {error}</p>}
    </div>
  );
}
