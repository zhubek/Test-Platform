"use client";

// Result View tab — compose the page a test-taker sees after finishing: view
// blocks (charts, tiles, text) whose props bind to the RESULT scope. Props take
// variables the same way single-question props do (the {{ }} picker / ExprInput);
// the variables offered are this test's declared variables + calculated values
// (from advancedParams) and the project PARAMETERS, plus the runtime context.
//
// Persists to the DB: each block is a TestBlock row on the RESULT surface; the
// live preview renders the declared variables at a sample value.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Plus, Trash2, X } from "lucide-react";
import {
  fetchBlocks,
  fetchTest,
  fetchTestBlocks,
  saveTestBlocks,
  type AdminTestBlock,
  type Block,
  type BlockProp,
} from "@/lib/backend";
import { ViewRenderer } from "@/lib/view-renderer";
import { resolvePath } from "@/lib/view-expr";
import { SAMPLE_CONTEXT } from "@/lib/mock-sources";
import { useProject } from "@/lib/project-context";
import { useLocale } from "@/lib/locale-context";
import {
  modeOf,
  resolveBlockRef,
  resolveInstanceProps,
  type StoredValue,
  type TestVar,
} from "@/lib/question-instances";
import { resultScopeFromStored } from "@/lib/test-runtime";
import { parameterVars, type ResultBlockInstance } from "@/lib/result-draft";
import { slugVar, type CalcVar, type CatalogMatch } from "@/lib/calculation-draft";
import { useDcGroups, groupByName, loadGroupItems, type DcItem } from "@/lib/dc-catalogs";
import {
  buildMatchObject,
  matchCharacteristics,
  matchObjectFields,
  pickRandomItems,
  sampleScores,
} from "@/lib/match-output";
import { localize } from "@/lib/localized";
import { type ExprVarGroup } from "@/components/prop-source";
import { InstancePropEditor } from "@/components/instance-prop-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MatchedProfessionCards,
  isProfessionMatchesBlock,
  type MatchRow,
} from "@/components/matched-profession-cards";
import { cn } from "@/lib/utils";

export function ResultViewTab({ testId }: { testId?: string }) {
  const { project } = useProject();
  const { locale } = useLocale();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ResultBlockInstance[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [sample, setSample] = useState(3);
  const idRef = useRef(0);

  // This test's declared variables + calculated values + catalog matches, from
  // the DB. They drive both the {{ }} picker and the preview scope.
  const [vars, setVars] = useState<TestVar[]>([]);
  const [calc, setCalc] = useState<CalcVar[]>([]);
  const [matches, setMatches] = useState<CatalogMatch[]>([]);
  const loadedRef = useRef(false);
  const catalogs = useDcGroups();
  // Real catalog items per matched catalog, for the preview's random samples.
  const [itemsByCatalog, setItemsByCatalog] = useState<Record<string, DcItem[]>>({});

  // ── Load: RESULT library + this test's RESULT blocks + declared variables ────
  useEffect(() => {
    if (!testId) {
      setLoading(false);
      loadedRef.current = true;
      return;
    }
    let active = true;
    setLoading(true);
    loadedRef.current = false;
    Promise.all([fetchBlocks("RESULT"), fetchTest(testId), fetchTestBlocks(testId, "RESULT")])
      .then(([lib, test, tbs]) => {
        if (!active) return;
        setBlocks(lib);
        const ap = (test.advancedParams ?? {}) as { vars?: unknown; calc?: unknown };
        setVars(
          Array.isArray(ap.vars)
            ? ap.vars.map((v) => ({
                name: String((v as TestVar).name ?? ""),
                initial: String((v as TestVar).initial ?? "0"),
              }))
            : [],
        );
        setCalc(Array.isArray(ap.calc) ? (ap.calc as CalcVar[]) : []);
        setMatches(Array.isArray((ap as { matches?: unknown }).matches) ? ((ap as { matches?: CatalogMatch[] }).matches ?? []) : []);
        setItems(
          tbs.map((b: AdminTestBlock) => ({
            id: b.id,
            blockId: b.blockId,
            blockName: b.block?.name,
            props: (b.props ?? {}) as Record<string, StoredValue>,
          })),
        );
        loadedRef.current = true;
      })
      .catch((e) => console.error("Failed to load result page:", e))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [testId]);

  // ── Debounced persistence to the DB (RESULT surface) ─────────────────────────
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const save = useCallback(
    (next: ResultBlockInstance[]) => {
      setItems(next);
      if (!testId || !loadedRef.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveTestBlocks(
          testId,
          "RESULT",
          next.map((it) => ({ blockId: it.blockId, props: it.props })),
        ).catch((e) => console.error("Failed to save result page:", e));
      }, 600);
    },
    [testId],
  );

  // Load the real items for each matched catalog (cached), for preview samples.
  useEffect(() => {
    const names = [...new Set(matches.map((m) => m.catalogId))];
    let active = true;
    Promise.all(
      names.map((name) => loadGroupItems(name).then((rows) => [name, rows] as const).catch(() => [name, []] as const)),
    ).then((pairs) => {
      if (active) setItemsByCatalog(Object.fromEntries(pairs));
    });
    return () => {
      active = false;
    };
  }, [matches]);

  // The variables a result prop can reference. Plain calc vars exclude the
  // derived top{r} objects — those are offered per-field under "Match" groups.
  const charVars = useMemo(
    () => [
      ...vars.filter((v) => v.name.trim()).map((v) => ({ token: v.name, hint: "variable" })),
      ...calc
        .filter((c) => c.name?.trim() && !c.derived)
        .map((c) => ({ token: c.name, hint: "calculated" })),
    ],
    [vars, calc],
  );
  const paramVars = useMemo(() => parameterVars(project.parameters, locale), [project.parameters, locale]);

  // One picker group per match. To avoid flooding the list with rank×field
  // tokens, only the FIRST rank is expanded into its fields (top1.name,
  // top1.score, top1.salary, …); every other rank is a single object token
  // (top2, top3, …) — you write top2.salary by analogy.
  const matchGroups: ExprVarGroup[] = useMemo(() => {
    return matches
      .map((m) => {
        const group = groupByName(m.catalogId);
        const fields = matchObjectFields(group);
        const fieldList = fields.map((f) => `.${f.token}`).join(" ");
        const bases = calc
          .filter((c) => c.matchId === m.id && c.derived)
          .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
          .map((c) => c.name);
        const items = bases.flatMap((base, i) =>
          i === 0
            ? [
                { token: base, hint: "match object" },
                ...fields.map((f) => ({ token: `${base}.${f.token}`, hint: f.hint })),
              ]
            : [{ token: base, hint: `match object — ${fieldList}` }],
        );
        return { label: `Match · ${m.catalogLabel}`, items };
      })
      .filter((g) => g.items.length > 0);
    // catalogs in deps so the group labels/fields refresh once catalogs load.
  }, [matches, calc, catalogs]);

  const exprGroups: ExprVarGroup[] = useMemo(() => {
    const groups: ExprVarGroup[] = [];
    if (charVars.length) groups.push({ label: "Variables", items: charVars });
    groups.push(...matchGroups);
    if (paramVars.length)
      groups.push({ label: "Parameters", items: paramVars.map((p) => ({ token: p.name, hint: p.hint })) });
    groups.push({
      label: "Context",
      items: RESULT_CONTEXT_PATHS.map((p) => ({ token: p, hint: String(resolvePath(p, SAMPLE_CONTEXT) ?? "") })),
    });
    return groups;
  }, [charVars, matchGroups, paramVars]);

  // Preview scope: each declared variable at the sample value, calc folded on
  // top, parameters at a sample option, plus the runtime context (result.*).
  const scope = useMemo(() => {
    const stored = vars
      .filter((v) => v.name.trim())
      .map((v) => ({ variable: v.name, value: sample }));
    const base = resultScopeFromStored(stored, calc, { ...SAMPLE_CONTEXT });
    for (const p of project.parameters) {
      const name = slugVar(localize(p.label, locale) || p.id);
      const opts = p.options.map((o) => localize(o, locale));
      base[name] = p.type === "multiple" ? opts.slice(0, 1) : opts[0] ?? "";
    }
    // Match outputs: each top{r} is an object from a random catalog item, with a
    // sorted-descending random fit score so top1.score ≥ top2.score ≥ ….
    for (const m of matches) {
      const group = groupByName(m.catalogId);
      const chars = matchCharacteristics(group, m);
      const bases = calc
        .filter((c) => c.matchId === m.id && c.derived)
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
      const picks = pickRandomItems(itemsByCatalog[m.catalogId] ?? [], bases.length);
      const scores = sampleScores(bases.length);
      bases.forEach((cv, i) => {
        const item = picks[i];
        base[cv.name] = item
          ? buildMatchObject(item, cv.rank ?? i + 1, scores[i], group, chars, locale)
          : { rank: cv.rank ?? i + 1, score: scores[i], name: `(no ${m.catalogLabel} items)` };
      });
    }
    // A flat `professions` collection (+ the catalog name) for the system
    // "Profession matches" block, built from the first match's top{r} objects.
    const m0 = matches[0];
    if (m0) {
      base.matchCatalog = m0.catalogId;
      base.professions = calc
        .filter((c) => c.matchId === m0.id && c.derived)
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
        .map((cv) => base[cv.name])
        .filter((o): o is Record<string, unknown> => !!o && typeof o === "object")
        .map((o) => ({
          rank: Number(o.rank) || 0,
          name: String(o.name ?? ""),
          score: Number(o.score) || 0,
          id: (o.id as string) ?? null,
        }));
    }
    return base;
  }, [vars, calc, matches, itemsByCatalog, project.parameters, locale, sample, catalogs]);

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

  const uid = () => `rb-${Date.now()}-${++idRef.current}`;

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
          <span className="text-sm font-semibold">{open ? "Block" : "Result page"}</span>
          <span className="text-[0.7rem] text-muted-foreground">
            {items.length} block{items.length !== 1 && "s"}
          </span>
        </div>

        <div className="max-h-[70vh] overflow-auto">
          {loading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Loading view blocks…</p>
          ) : picking ? (
            <BlockPicker blocks={blocks} onPick={addBlock} onCancel={() => setPicking(false)} />
          ) : open && openBlock ? (
            <BlockInstanceEditor
              block={openBlock}
              item={open}
              scope={scope}
              groups={exprGroups}
              onPatchProp={(name, v) => patchProp(open.id, name, v)}
              onBack={() => setOpenId(null)}
            />
          ) : (
            <div className="space-y-2 p-3">
              {items.length === 0 && (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No blocks yet. Add a view block and bind its props to characteristics or parameters.
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
                        {block?.description || "View block"}
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
            answers ={" "}
            <Input
              type="number"
              value={sample}
              onChange={(e) => setSample(Number(e.target.value) || 0)}
              className="h-6 w-14 text-xs"
            />
          </div>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-auto bg-gray-50/50 p-5">
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">The result page renders here.</p>
          ) : (
            items.map((it) => {
              const block = resolveBlockRef(it, blocks);
              if (!block) return null;
              const isMatches = isProfessionMatchesBlock(block);
              const types = new Map(block.props.map((p) => [p.name, p.type]));
              const resolved = isMatches ? {} : resolveInstanceProps(it, types, scope);
              return (
                <div
                  key={it.id}
                  className={cn("rounded-xl transition-shadow", openId === it.id && "ring-2 ring-teal-400/60")}
                  onClick={() => setOpenId(it.id)}
                >
                  {isMatches ? (
                    <MatchedProfessionCards
                      catalog={matches[0]?.catalogId}
                      matches={(scope.professions as MatchRow[]) ?? []}
                    />
                  ) : (
                    <ViewRenderer template={block.html} props={resolved} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Result-time context: result.* exists now (unlike during the test).
const RESULT_CONTEXT_PATHS = [
  "user.name",
  "user.org",
  "result.total",
  "result.topScale",
  "result.completedAt",
  "today",
];

// --------------------------------------------------------------------------

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
        <span className="text-sm font-semibold">Pick a view block</span>
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

function BlockInstanceEditor({
  block,
  item,
  scope,
  groups,
  onPatchProp,
  onBack,
}: {
  block: Block;
  item: ResultBlockInstance;
  scope: Record<string, unknown>;
  groups: ExprVarGroup[];
  onPatchProp: (name: string, v: StoredValue) => void;
  onBack: () => void;
}) {
  return (
    <div>
      <div className="border-b px-3 py-2.5">
        <button
          onClick={onBack}
          className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Result page
        </button>
        <p className="text-sm font-semibold">{block.name}</p>
      </div>
      <div className="space-y-4 p-4">
        {block.props.map((p) => (
          <InstancePropEditor
            key={p.name}
            def={p}
            value={item.props[p.name]}
            scope={scope}
            groups={groups}
            onChange={(v) => onPatchProp(p.name, v)}
          />
        ))}
      </div>
    </div>
  );
}
