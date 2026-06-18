"use client";

// Calculation tab — define the test's DERIVED variables: scores computed after
// all answers are in.
//
// The core unit is a CATALOG MATCH: pick a data catalog (Professions) + one of
// the characteristic groups attached to it (Interests/RIASEC) + a distance
// method + N. That seeds:
//   · one EDITABLE characteristic variable per characteristic — you write the
//     formula that scores it from answers (same ExprInput as elsewhere), and
//   · read-only DERIVED variables top1…topN — each an OBJECT for the matched
//     catalog item (its fields + extra variables + `score`). Reference e.g.
//     top1.score, top1.salary, top1.name.
// Standalone custom variables are still supported via "Variable".
//
// Persists to the DB (advancedParams.calc + .matches); reads inputs (answer
// fields + test variables) from the test's QUESTION blocks + advancedParams.vars.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Lock, Plus, Trash2, X } from "lucide-react";
import { useDcGroups, groupByName, type DcCharacteristicGroup, type DcGroup } from "@/lib/dc-catalogs";
import { TEST_CONTEXT_PATHS, TEST_SAMPLE_CONTEXT } from "@/lib/mock-sources";
import { resolvePath } from "@/lib/view-expr";
import {
  buildMatchVars,
  calcScope,
  DISTANCE_METHODS,
  matchPrefix,
  questionInputs,
  type CalcVar,
  type CatalogMatch,
  type DistanceMethod,
} from "@/lib/calculation-draft";
import { matchObjectFields } from "@/lib/match-output";
import { fetchTest, fetchTestBlocks, updateTest } from "@/lib/backend";
import type { QuestionsDraft } from "@/lib/question-instances";
import { ExprInput, type ExprVarGroup } from "@/components/prop-source";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Session-unique id (pure — no Date.now/random during render).
let _seq = 0;
const uid = () => `cv-${++_seq}`;

export function CalculationTab({ testId }: { testId?: string }) {
  const [vars, setVars] = useState<CalcVar[]>([]);
  const [matches, setMatches] = useState<CatalogMatch[]>([]);
  const [questions, setQuestions] = useState<QuestionsDraft>({ vars: [], items: [] });
  const [adding, setAdding] = useState(false);
  const [sample, setSample] = useState(3);

  const catalogs = useDcGroups(); // data catalog groups (with attached characteristics)

  // Full advancedParams bag (replaced wholesale on save) + a load guard so a
  // mount-time save can't wipe calc/matches before the real values arrive.
  const apBaseRef = useRef<Record<string, unknown>>({});
  const loadedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load from the DB: calc vars + matches from advancedParams; inputs (answer
  // fields + test variables) from the QUESTION blocks + advancedParams.vars. ────
  useEffect(() => {
    if (!testId) return;
    let active = true;
    loadedRef.current = false;
    Promise.all([fetchTest(testId), fetchTestBlocks(testId, "QUESTION")])
      .then(([test, qb]) => {
        if (!active) return;
        const ap = (test.advancedParams ?? {}) as {
          calc?: unknown;
          matches?: unknown;
          vars?: unknown;
        };
        apBaseRef.current = test.advancedParams ?? {};
        const rawCalc = Array.isArray(ap.calc) ? (ap.calc as CalcVar[]) : [];
        setVars(rawCalc.map((c) => ({ ...c, id: c.id ?? uid() })));
        setMatches(Array.isArray(ap.matches) ? (ap.matches as CatalogMatch[]) : []);
        const testVars = Array.isArray(ap.vars)
          ? (ap.vars as { name?: unknown; initial?: unknown }[]).map((v) => ({
              name: String(v.name ?? ""),
              initial: String(v.initial ?? "0"),
            }))
          : [];
        setQuestions({
          vars: testVars,
          items: qb.map((b) => ({ id: b.id, blockId: b.blockId, props: b.props })),
        });
        loadedRef.current = true;
      })
      .catch((e) => console.error("Failed to load calculation:", e));
    return () => {
      active = false;
    };
  }, [testId]);

  const save = useCallback(
    (nextVars: CalcVar[], nextMatches: CatalogMatch[]) => {
      setVars(nextVars);
      setMatches(nextMatches);
      if (!testId || !loadedRef.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        updateTest(testId, {
          advancedParams: { ...apBaseRef.current, calc: nextVars, matches: nextMatches },
        })
          .then((t) => {
            apBaseRef.current = t.advancedParams ?? {};
          })
          .catch((e) => console.error("Failed to save calculation:", e));
      }, 600);
    },
    [testId],
  );

  const { answers, testVars } = useMemo(() => questionInputs(questions), [questions]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const addVariable = () => save([...vars, { id: uid(), name: "", expr: "" }], matches);

  const addMatch = (
    catalog: DcGroup,
    charGroup: DcCharacteristicGroup,
    method: DistanceMethod,
    topN: number,
  ) => {
    const taken = new Set(vars.map((v) => v.name.trim()).filter(Boolean));
    const match: CatalogMatch = {
      id: uid(),
      catalogId: catalog.name,
      catalogLabel: catalog.info?.label ?? catalog.name,
      groupId: charGroup.id,
      groupName: charGroup.name,
      groupColor: charGroup.color ?? undefined,
      method,
      topN,
      prefix: matchPrefix(catalog.name, taken),
    };
    const newVars = buildMatchVars(match, charGroup.characteristics, taken, uid);
    save([...vars, ...newVars], [...matches, match]);
    setAdding(false);
  };

  const removeMatch = (matchId: string) =>
    save(vars.filter((v) => v.matchId !== matchId), matches.filter((m) => m.id !== matchId));

  const updateMatch = (matchId: string, patch: Partial<CatalogMatch>) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    const next = { ...match, ...patch };
    let nextVars = vars;
    if (patch.topN !== undefined && patch.topN !== match.topN) {
      const derived: CalcVar[] = [];
      for (let r = 1; r <= Math.max(1, next.topN); r++) {
        derived.push({ id: uid(), name: `${match.prefix}${r}`, expr: "", matchId, derived: "match", rank: r });
      }
      nextVars = [...vars.filter((v) => !(v.matchId === matchId && v.derived)), ...derived];
    }
    save(nextVars, matches.map((m) => (m.id === matchId ? next : m)));
  };

  const updateVar = (id: string, patch: Partial<CalcVar>) =>
    save(vars.map((v) => (v.id === id ? { ...v, ...patch } : v)), matches);
  const removeVar = (id: string) => save(vars.filter((v) => v.id !== id), matches);

  // The picker offered to each row: inputs + the calc vars defined BEFORE it
  // (so suggestions never forward-reference) + context. Functions are built in.
  const groupsForRow = useCallback(
    (index: number): ExprVarGroup[] => {
      const earlier = vars
        .slice(0, index)
        .filter((v) => !v.derived) // can't reference not-yet-computed match outputs
        .map((v) => v.name.trim())
        .filter(Boolean)
        .map((n) => ({ token: n, hint: "calc variable" }));
      const list: ExprVarGroup[] = [];
      if (answers.length) list.push({ label: "Answer variables", items: answers.map((a) => ({ token: a.name, hint: a.hint })) });
      if (testVars.length) list.push({ label: "Test variables", items: testVars.map((t) => ({ token: t.name, hint: t.hint })) });
      if (earlier.length) list.push({ label: "Calculation variables", items: earlier });
      list.push({
        label: "Context",
        items: TEST_CONTEXT_PATHS.map((p) => ({ token: p, hint: String(resolvePath(p, TEST_SAMPLE_CONTEXT) ?? "") })),
      });
      return list;
    },
    [vars, answers, testVars],
  );

  const indexOf = (id: string) => vars.findIndex((v) => v.id === id);
  const standalone = vars.filter((v) => !v.matchId);
  const finalScope = useMemo(() => calcScope(questions, vars, sample), [questions, vars, sample]);
  const isEmpty = matches.length === 0 && standalone.length === 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      {/* Builder */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <span className="text-sm font-semibold">Calculation</span>
          <span className="text-[0.7rem] text-muted-foreground">
            {matches.length} match{matches.length !== 1 && "es"} · {vars.length} variable{vars.length !== 1 && "s"}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-7" onClick={() => setAdding((p) => !p)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Catalog match
            </Button>
            <Button variant="outline" size="sm" className="h-7" onClick={addVariable}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Variable
            </Button>
          </div>
        </div>

        {adding && (
          <CatalogMatchForm catalogs={catalogs} onAdd={addMatch} onClose={() => setAdding(false)} />
        )}

        <div className="max-h-[68vh] space-y-3 overflow-auto p-3">
          {isEmpty ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No calculations yet. Add a <strong>catalog match</strong> to score the respondent against a
              data catalog (e.g. Professions) and produce the closest items, or a single
              <strong> variable</strong> for a custom score.
            </div>
          ) : (
            <>
              {matches.map((m) => (
                <MatchBlock
                  key={m.id}
                  match={m}
                  vars={vars}
                  questions={questions}
                  sample={sample}
                  indexOf={indexOf}
                  groupsForRow={groupsForRow}
                  onUpdateMatch={(patch) => updateMatch(m.id, patch)}
                  onRemoveMatch={() => removeMatch(m.id)}
                  onUpdateVar={updateVar}
                />
              ))}

              {standalone.length > 0 && (
                <div className="space-y-2">
                  {matches.length > 0 && (
                    <div className="pt-1 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                      Custom variables
                    </div>
                  )}
                  {standalone.map((v) => (
                    <VarRow
                      key={v.id}
                      cv={v}
                      scope={calcScope(questions, vars, sample, indexOf(v.id))}
                      groups={groupsForRow(indexOf(v.id))}
                      onChange={(patch) => updateVar(v.id, patch)}
                      onRemove={() => removeVar(v.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Inputs + outputs reference */}
      <div className="space-y-3">
        <Panel title="Available inputs">
          <RefGroup label="Answer variables" items={answers.map((a) => a.name)} empty="No questions with variables yet." />
          <RefGroup label="Test variables" items={testVars.map((t) => t.name)} empty="None declared." />
          <p className="mt-2 border-t pt-2 text-[0.62rem] leading-relaxed text-muted-foreground">
            From the Questions tab. Reference them in any formula, plus functions like{" "}
            <code className="font-mono">round</code>, <code className="font-mono">avg</code>,{" "}
            <code className="font-mono">if</code>.
          </p>
        </Panel>

        <Panel title="Outputs (sample)">
          <div className="mb-2 flex items-center gap-1.5 text-[0.66rem] text-muted-foreground">
            answers ={" "}
            <Input type="number" value={sample} onChange={(e) => setSample(Number(e.target.value) || 0)} className="h-6 w-16 text-xs" />
          </div>
          {vars.filter((v) => !v.derived && v.name.trim()).length === 0 ? (
            <p className="text-[0.66rem] text-muted-foreground">Name a variable to see its value.</p>
          ) : (
            <div className="space-y-1">
              {vars
                .filter((v) => !v.derived && v.name.trim())
                .map((v) => (
                  <div key={v.id} className="flex items-baseline justify-between gap-2 text-xs">
                    <code className="truncate font-mono text-muted-foreground">{v.name}</code>
                    <span className="shrink-0 font-mono font-semibold tabular-nums">{fmt(finalScope[v.name.trim()])}</span>
                  </div>
                ))}
            </div>
          )}
          <p className="mt-2 border-t pt-2 text-[0.62rem] leading-relaxed text-muted-foreground">
            Match outputs (<code className="font-mono">top1</code>…) are objects (
            <code className="font-mono">top1.score</code>, <code className="font-mono">top1.name</code>…)
            computed at completion and aren&apos;t previewed here.
          </p>
        </Panel>
      </div>
    </div>
  );
}

// ── One catalog match ────────────────────────────────────────────────────────
function MatchBlock({
  match,
  vars,
  questions,
  sample,
  indexOf,
  groupsForRow,
  onUpdateMatch,
  onRemoveMatch,
  onUpdateVar,
}: {
  match: CatalogMatch;
  vars: CalcVar[];
  questions: QuestionsDraft;
  sample: number;
  indexOf: (id: string) => number;
  groupsForRow: (index: number) => ExprVarGroup[];
  onUpdateMatch: (patch: Partial<CatalogMatch>) => void;
  onRemoveMatch: () => void;
  onUpdateVar: (id: string, patch: Partial<CalcVar>) => void;
}) {
  const charVars = vars.filter((v) => v.matchId === match.id && v.characteristicId);
  const matchOutputs = vars
    .filter((v) => v.matchId === match.id && v.derived)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  // The fields each top{r} object exposes (name, score, extra variables).
  const objectFields = matchObjectFields(groupByName(match.catalogId));

  return (
    <div className="rounded-lg border bg-background">
      {/* Header: catalog · group · method · N */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-3 py-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: match.groupColor ?? "#6b7280" }} />
        <span className="text-[0.78rem] font-semibold">{match.catalogLabel}</span>
        <span className="text-[0.66rem] text-muted-foreground">match · {match.groupName}</span>

        <div className="ml-auto flex items-center gap-1.5">
          <select
            value={match.method}
            onChange={(e) => onUpdateMatch({ method: e.target.value as DistanceMethod })}
            title="Distance method"
            className="h-7 rounded-md border border-gray-200 bg-white px-1.5 text-[0.7rem] text-gray-700 outline-none focus:border-teal-400"
          >
            {DISTANCE_METHODS.map((d) => (
              <option key={d.id} value={d.id}>{d.id}</option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-[0.66rem] text-muted-foreground">
            top
            <Input
              type="number"
              min={1}
              max={50}
              value={match.topN}
              onChange={(e) => onUpdateMatch({ topN: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })}
              className="h-7 w-14 text-xs"
            />
          </label>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-red-500"
            title="Remove match"
            onClick={onRemoveMatch}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Editable characteristic variables */}
      <div className="space-y-2 p-2.5">
        <div className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Characteristics — write each score formula
        </div>
        {charVars.map((cv) => (
          <VarRow
            key={cv.id}
            cv={cv}
            scope={calcScope(questions, vars, sample, indexOf(cv.id))}
            groups={groupsForRow(indexOf(cv.id))}
            onChange={(patch) => onUpdateVar(cv.id, patch)}
          />
        ))}

        {/* Read-only derived outputs — one object per rank */}
        <div className="mt-1 rounded-md border border-dashed bg-muted/20 p-2.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
            <Lock className="h-3 w-3" /> Match outputs · read-only objects
          </div>
          <DerivedRow label="Closest items" hint="objects, top1…topN" vars={matchOutputs} />
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
            <span className="text-[0.6rem] text-muted-foreground">each carries</span>
            {objectFields.map((f) => (
              <code
                key={f.token}
                title={f.hint}
                className="rounded bg-white px-1.5 py-0.5 font-mono text-[0.64rem] text-gray-500 ring-1 ring-gray-200"
              >
                .{f.token}
              </code>
            ))}
          </div>
          <p className="mt-1.5 text-[0.6rem] leading-relaxed text-muted-foreground">
            e.g. <code className="font-mono">{matchOutputs[0]?.name ?? "top1"}.score</code>,{" "}
            <code className="font-mono">{matchOutputs[0]?.name ?? "top1"}.{objectFields[2]?.token ?? "name"}</code>.
            Computed at completion; values aren&apos;t previewed here.
          </p>
        </div>
      </div>
    </div>
  );
}

function DerivedRow({ label, hint, vars }: { label: string; hint: string; vars: CalcVar[] }) {
  return (
    <div className="mb-1 last:mb-0">
      <div className="mb-1 flex items-baseline gap-1.5">
        <span className="text-[0.66rem] font-medium text-gray-600">{label}</span>
        <span className="text-[0.6rem] text-muted-foreground">{hint}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {vars.map((v) => (
          <code key={v.id} className="rounded bg-white px-1.5 py-0.5 font-mono text-[0.66rem] text-gray-500 ring-1 ring-gray-200">
            {v.name}
          </code>
        ))}
      </div>
    </div>
  );
}

function VarRow({
  cv,
  scope,
  groups,
  onChange,
  onRemove,
}: {
  cv: CalcVar;
  scope: Record<string, unknown>;
  groups: ExprVarGroup[];
  onChange: (patch: Partial<CalcVar>) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-start gap-1.5 rounded-lg border bg-background p-2">
      <div className="w-40 shrink-0">
        <Input
          value={cv.name}
          placeholder="variable"
          onChange={(e) => onChange({ name: e.target.value })}
          className="h-8 font-mono text-xs"
        />
        {cv.characteristicName && (
          <p className="mt-0.5 truncate px-1 text-[0.6rem] text-muted-foreground" title={cv.characteristicName}>
            {cv.characteristicName}
          </p>
        )}
      </div>
      <span className="mt-1.5 text-xs text-muted-foreground">=</span>
      <div className="min-w-0 flex-1">
        <ExprInput
          bare
          value={cv.expr}
          scope={scope}
          groups={groups}
          placeholder="e.g. (q1 + q2 + q3) / 3"
          onChange={(expr) => onChange({ expr })}
        />
      </div>
      {onRemove && (
        <Button variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground hover:text-red-500" onClick={onRemove}>
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// ── Add-a-match form ─────────────────────────────────────────────────────────
function CatalogMatchForm({
  catalogs,
  onAdd,
  onClose,
}: {
  catalogs: DcGroup[];
  onAdd: (catalog: DcGroup, group: DcCharacteristicGroup, method: DistanceMethod, topN: number) => void;
  onClose: () => void;
}) {
  // Only catalogs that have characteristic groups attached can be matched.
  const matchable = catalogs.filter((c) => c.characteristics.length > 0);
  const [catalogId, setCatalogId] = useState(matchable[0]?.id ?? "");
  const [groupId, setGroupId] = useState("");
  const [method, setMethod] = useState<DistanceMethod>("cosine");
  const [topN, setTopN] = useState(10);

  const catalog = matchable.find((c) => c.id === catalogId) ?? matchable[0];
  const charGroups = (catalog?.characteristics ?? []).map((l) => l.characteristicGroup);
  // Effective group: the chosen one if still valid, else the first available.
  const group = charGroups.find((g) => g.id === groupId) ?? charGroups[0];

  const pickCatalog = (id: string) => {
    setCatalogId(id);
    const next = (matchable.find((c) => c.id === id)?.characteristics ?? []).map((l) => l.characteristicGroup);
    setGroupId(next[0]?.id ?? "");
  };

  return (
    <div className="border-b bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">Add a catalog match</span>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {matchable.length === 0 ? (
        <p className="py-3 text-center text-xs text-muted-foreground">
          No catalog has characteristic groups attached yet. Attach one in Catalogs → a catalog group →
          Parameters → Characteristics.
        </p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Field label="Catalog">
            <select
              value={catalog?.id ?? ""}
              onChange={(e) => pickCatalog(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none focus:border-teal-400"
            >
              {matchable.map((c) => (
                <option key={c.id} value={c.id}>{c.info?.label ?? c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Characteristics">
            <select
              value={group?.id ?? ""}
              onChange={(e) => setGroupId(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none focus:border-teal-400"
            >
              {charGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.characteristics.length})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Match method">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as DistanceMethod)}
              className="h-8 w-full rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none focus:border-teal-400"
            >
              {DISTANCE_METHODS.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Closest items (N)">
            <Input
              type="number"
              min={1}
              max={50}
              value={topN}
              onChange={(e) => setTopN(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              className="h-8 text-xs"
            />
          </Field>

          <div className="sm:col-span-2">
            <Button
              size="sm"
              className="h-8 w-full"
              disabled={!catalog || !group}
              onClick={() => catalog && group && onAdd(catalog, group, method, topN)}
            >
              Add match — {group?.characteristics.length ?? 0} characteristics + top{topN} + scores
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function RefGroup({ label, items, empty }: { label: string; items: string[]; empty: string }) {
  return (
    <div className="mb-2">
      <p className="mb-1 text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground/70">{label}</p>
      {items.length === 0 ? (
        <p className="text-[0.66rem] text-muted-foreground">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {items.map((n) => (
            <code key={n} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.66rem]">{n}</code>
          ))}
        </div>
      )}
    </div>
  );
}

function fmt(v: unknown): string {
  if (typeof v === "number") return Number.isFinite(v) ? String(Math.round(v * 100) / 100) : "—";
  if (v == null || v === "") return "—";
  return String(v);
}
