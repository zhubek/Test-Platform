"use client";

// Per-prop source editors — "where does this prop's value come from".
// Static keeps the regular value controls; Database builds a query against the
// source registry (mocked in @/lib/mock-sources for now — the same DbBinding
// will later be executed by the backend); Context picks a path from the runtime
// context (viewer / result / page filter panel), previewed against a sample.

import { useId, useRef, useState } from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Braces, Plus, X } from "lucide-react";
import {
  CONTEXT_PATHS,
  METRIC_FNS,
  SAMPLE_CONTEXT,
  SOURCES,
  distinctValues,
  mapRowValue,
  runMetric,
  runQuery,
  sourceByKey,
  type DataSource,
  type DbBinding,
  type DbFilter,
  type MapPair,
} from "@/lib/mock-sources";
import { FUNC_DOCS, evaluate, resolvePath, validate, validateTemplate } from "@/lib/view-expr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type PropMode = "static" | "expr" | "db" | "ctx";

const NONE = "__none__";

const MODE_LABELS: Record<PropMode, string> = { static: "Static", expr: "Expression", db: "Database", ctx: "Context" };

export function ModeToggle({
  mode,
  onChange,
  modes = ["static", "db", "ctx"],
}: {
  mode: PropMode;
  onChange: (m: PropMode) => void;
  modes?: PropMode[];
}) {
  const MODES = modes.map((key) => ({ key, label: MODE_LABELS[key] }));
  return (
    <div className="inline-flex rounded-md border bg-card p-0.5">
      {MODES.map((m) => (
        <button
          key={m.key}
          type="button"
          onClick={() => onChange(m.key)}
          className={cn(
            "rounded px-2 py-0.5 text-[0.66rem] font-medium transition-colors",
            mode === m.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

// --------------------------------------------------------------------------
// Database binding editor

export function DbEditor({
  binding,
  onChange,
  scalar,
  expects,
}: {
  binding: DbBinding;
  onChange: (b: DbBinding) => void;
  scalar: boolean; // text/number props take one value (a metric); json/list take rows
  expects?: string[]; // field names the block's template reads (seeds the mapping)
}) {
  const src = sourceByKey(binding.source);
  const set = (patch: Partial<DbBinding>) => onChange({ ...binding, ...patch });

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-2.5">
      <Row label="Source">
        <Select
          value={binding.source || null}
          items={Object.fromEntries(SOURCES.map((s) => [s.key, `${s.group} · ${s.label}`]))}
          onValueChange={(v) =>
            set({
              source: !v || v === NONE ? "" : v,
              filters: [],
              sort: undefined,
              metric: undefined,
              // Pre-create one mapping row per field the block reads, so the
              // author only has to pick the source column for each.
              map: expects?.length ? expects.map((to) => ({ to, from: "" })) : undefined,
            })
          }
        >
          <SelectTrigger size="sm" className="w-full bg-card">
            <SelectValue placeholder="Pick a data source…" />
          </SelectTrigger>
          <SelectContent>
            {SOURCES.map((s) => (
              <SelectItem key={s.key} value={s.key}>
                {s.group} · {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>

      {src && (
        <>
          {scalar && <MetricRow src={src} binding={binding} set={set} />}

          <Row label="Filters">
            <div className="space-y-1.5">
              {binding.filters.map((f, i) => (
                <FilterRow
                  key={i}
                  src={src}
                  filter={f}
                  onChange={(nf) => set({ filters: binding.filters.map((x, j) => (j === i ? nf : x)) })}
                  onRemove={() => set({ filters: binding.filters.filter((_, j) => j !== i) })}
                />
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[0.68rem] text-primary hover:text-teal-700"
                onClick={() => set({ filters: [...binding.filters, { field: src.fields[0].key, op: "eq", value: "" }] })}
              >
                <Plus className="h-3 w-3" /> Add filter
              </Button>
            </div>
          </Row>

          {!scalar && (
            <>
              <Row label="Sort / limit">
                <div className="flex items-center gap-1.5">
                  <Select
                    value={binding.sort ?? NONE}
                    items={{ [NONE]: "No sort", ...Object.fromEntries(src.fields.map((f) => [f.key, f.key])) }}
                    onValueChange={(v) => set({ sort: !v || v === NONE ? undefined : v })}
                  >
                    <SelectTrigger size="sm" className="flex-1 bg-card">
                      <SelectValue placeholder="No sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>No sort</SelectItem>
                      {src.fields.map((f) => (
                        <SelectItem key={f.key} value={f.key}>{f.key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="shrink-0 bg-card"
                    title={binding.dir === "desc" ? "Descending" : "Ascending"}
                    onClick={() => set({ dir: binding.dir === "desc" ? "asc" : "desc" })}
                  >
                    {binding.dir === "desc" ? <ArrowDownWideNarrow className="h-3.5 w-3.5" /> : <ArrowUpNarrowWide className="h-3.5 w-3.5" />}
                  </Button>
                  <Input
                    type="number"
                    value={binding.limit ?? ""}
                    placeholder="∞"
                    title="Limit"
                    onChange={(e) => set({ limit: e.target.value ? Math.max(1, Number(e.target.value)) : undefined })}
                    className="h-8 w-16 bg-card text-xs"
                  />
                </div>
              </Row>

              <MapFieldsRow binding={binding} src={src} expects={expects} set={set} />
            </>
          )}

          <Row label="Preview">
            {scalar ? (
              <div className="rounded-md border bg-card px-3 py-2 text-lg font-bold tabular-nums text-foreground">
                {runMetric(binding).toLocaleString()}
              </div>
            ) : (
              <RowsPreview rows={runQuery(binding)} />
            )}
          </Row>
        </>
      )}

      <p className="text-[0.62rem] text-amber-600/90">
        Prototype: queries run on mock data in the browser. The same binding will be executed by the backend source registry.
      </p>
    </div>
  );
}

function MetricRow({ src, binding, set }: { src: DataSource; binding: DbBinding; set: (p: Partial<DbBinding>) => void }) {
  const [fn = "count", field = ""] = (binding.metric ?? "count").split(":");
  const numberFields = src.fields.filter((f) => f.type === "number");
  return (
    <Row label="Metric">
      <div className="flex items-center gap-1.5">
        <Select value={fn} onValueChange={(v) => set({ metric: v === "count" ? "count" : `${v}:${field || numberFields[0]?.key || ""}` })}>
          <SelectTrigger size="sm" className="w-24 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METRIC_FNS.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fn !== "count" && (
          <Select value={field || NONE} onValueChange={(v) => set({ metric: `${fn}:${v === NONE ? "" : v}` })}>
            <SelectTrigger size="sm" className="flex-1 bg-card">
              <SelectValue placeholder="field" />
            </SelectTrigger>
            <SelectContent>
              {numberFields.map((f) => (
                <SelectItem key={f.key} value={f.key}>{f.key}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </Row>
  );
}

// --------------------------------------------------------------------------
// ExprInput — THE text-with-{{expressions}} input used everywhere: static text
// plus references and builtin functions. Typing "{{" opens autocomplete
// filtered as you type; the brace button opens the full menu. Variables come
// from the caller (answer vars + context in the test builder, the table's
// columns in map fields). Below the input: a live rendered preview against
// `scope`, or the first validation error.

export interface ExprVarGroup {
  label: string;
  items: { token: string; hint: string }[];
}

export function ExprInput({
  value,
  onChange,
  scope,
  groups,
  placeholder,
  bare = false,
}: {
  value: string;
  onChange: (v: string) => void;
  scope: Record<string, unknown>;
  groups: ExprVarGroup[];
  placeholder?: string;
  // bare: the WHOLE value is one expression (conditions, assignments) — no
  // {{ }} wrapping; inserts drop plain tokens and the preview always evaluates.
  bare?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<string | null>(null); // autocomplete prefix
  const inputRef = useRef<HTMLInputElement>(null);

  const hasExpr = bare ? value.trim() !== "" : value.includes("{{") || value.includes("}}");
  const error = !hasExpr ? null : bare ? validate(value) : validateTemplate(value);
  const rendered = hasExpr && !error ? (bare ? evaluate(value, scope) : mapRowValue(value, scope)) : null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    onChange(next);
    const cur = e.target.selectionStart ?? next.length;
    const m = bare
      ? next.slice(0, cur).match(/([A-Za-z_$][\w.$]*)$/)
      : next.slice(0, cur).match(/\{\{\s*([\w.$]*)$/);
    if (m) {
      setFilter(m[1]);
      setMenuOpen(true);
    } else {
      setFilter(null);
      setMenuOpen(false);
    }
  };

  const insert = (token: string) => {
    const el = inputRef.current;
    const cur = el?.selectionStart ?? value.length;
    let before: string;
    let text: string;
    if (filter !== null) {
      before = value.slice(0, cur - filter.length);
      text = bare ? token : `${token}}}`;
    } else {
      before = value.slice(0, cur);
      text = bare ? token : `{{${token}}}`;
    }
    const after = value.slice(el?.selectionEnd ?? cur);
    onChange(before + text + after);
    setMenuOpen(false);
    setFilter(null);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = (before + text).length;
      el?.setSelectionRange(pos, pos);
    });
  };

  const q = (filter ?? "").toLowerCase();
  const shown = groups
    .map((g) => ({ ...g, items: g.items.filter((it) => it.token.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length > 0);
  const fns = FUNC_DOCS.filter((d) => !q || d.sig.toLowerCase().includes(q) || d.snippet.toLowerCase().includes(q));

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setMenuOpen(false);
              setFilter(null);
            }
          }}
          className={cn("h-8 flex-1 bg-card", error && "border-red-400 focus-visible:ring-red-300")}
        />
        <Button
          variant="outline"
          size="icon-sm"
          title="Insert variable or function"
          onClick={() => {
            setFilter(null);
            setMenuOpen((o) => !o);
          }}
          className={cn("shrink-0", menuOpen && "border-teal-400 text-teal-600")}
        >
          <Braces className="h-3.5 w-3.5" />
        </Button>
      </div>

      {error ? (
        <p className="mt-1 text-[0.66rem] text-red-500">{error}</p>
      ) : rendered !== null ? (
        <p className="mt-1 truncate text-[0.66rem] text-muted-foreground">
          → <span className="text-foreground/80">{String(rendered)}</span>
        </p>
      ) : null}

      {menuOpen && (
        <div className="absolute right-0 z-20 mt-1 max-h-64 w-80 overflow-auto rounded-lg border bg-card p-1 shadow-lg">
          {shown.map((g) => (
            <div key={g.label}>
              <p className="px-2 pt-1.5 pb-1 text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
                {g.label}
              </p>
              {g.items.map((it) => (
                <ExprMenuItem key={it.token} label={it.token} hint={it.hint} onClick={() => insert(it.token)} />
              ))}
            </div>
          ))}
          {fns.length > 0 && (
            <div>
              <p className="px-2 pt-1.5 pb-1 text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Functions
              </p>
              {fns.map((d) => (
                <ExprMenuItem key={d.sig} label={d.sig} hint={d.doc} onClick={() => insert(d.snippet)} />
              ))}
            </div>
          )}
          {shown.length === 0 && fns.length === 0 && (
            <p className="px-2 py-2 text-[0.68rem] text-muted-foreground">No matches for “{filter}”.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ExprMenuItem({ label, hint, onClick }: { label: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-baseline justify-between gap-2 rounded-md px-2 py-1 text-left hover:bg-muted"
    >
      <code className="shrink-0 font-mono text-[0.72rem] text-foreground">{label}</code>
      <span className="truncate text-[0.62rem] text-muted-foreground">{hint}</span>
    </button>
  );
}

// Map fields — right side uses the SAME syntax as every other authored field:
// static text + {{expressions}}, run once per row. A pure {{expr}} keeps its
// raw type (numbers stay numbers). Previews resolve against the first row.
function MapFieldsRow({
  binding,
  src,
  expects,
  set,
}: {
  binding: DbBinding;
  src: DataSource;
  expects?: string[];
  set: (patch: Partial<DbBinding>) => void;
}) {
  const firstRow = runQuery({ ...binding, map: undefined })[0];
  const rowScope = firstRow ? { ...firstRow, index: 0 } : {};

  // The insert menu offers THIS TABLE's columns as the variables (with the
  // first row's values as hints), plus the builtin functions.
  const columnGroups: ExprVarGroup[] = [
    {
      label: "Row columns",
      items: [
        ...src.fields.map((f) => ({ token: f.key, hint: String(firstRow?.[f.key] ?? "") })),
        { token: "index", hint: "row number, 0-based" },
      ],
    },
  ];

  const fromEditor = (m: MapPair, onFrom: (from: string) => void) => (
    <div className="min-w-0 flex-1">
      <ExprInput
        value={m.from}
        onChange={onFrom}
        scope={rowScope}
        groups={columnGroups}
        placeholder="text with {{expressions}} — e.g. {{title}} ({{city}})"
      />
    </div>
  );

  return (
    <Row label="Map fields">
      <p className="mb-1.5 text-[0.64rem] leading-relaxed text-muted-foreground">
        Same syntax as any field — text plus <code className="font-mono">{"{{expressions}}"}</code>, run{" "}
        <span className="font-medium text-foreground">for each row</span> with its columns in scope:{" "}
        <code className="font-mono">{"{{title}} ({{city}})"}</code>,{" "}
        <code className="font-mono">{"{{round(demand / 10)}}"}</code>. Columns:{" "}
        <code className="font-mono">{src.fields.map((f) => f.key).join(", ")}</code>, <code className="font-mono">index</code>.
      </p>
      {expects?.length ? (
        // The block dictates its field names (options → text, value) — fixed.
        <div className="space-y-1.5">
          {expects.map((to) => {
            const m = (binding.map ?? []).find((x) => x.to === to) ?? { to, from: "" };
            const setFrom = (from: string) => {
              const map = [...(binding.map ?? [])];
              const i = map.findIndex((x) => x.to === to);
              if (i >= 0) map[i] = { to, from };
              else map.push({ to, from });
              set({ map });
            };
            return (
              <div key={to} className="flex items-start gap-1.5">
                <code className="w-16 shrink-0 rounded-md bg-muted px-2 py-1.5 text-center font-mono text-xs text-foreground">
                  {to}
                </code>
                <span className="mt-1.5 text-xs text-muted-foreground">←</span>
                {fromEditor(m, setFrom)}
              </div>
            );
          })}
        </div>
      ) : (
        // Unknown target shape (free-form view blocks): editable pairs.
        <div className="space-y-1.5">
          {(binding.map ?? []).map((m, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <Input
                value={m.to}
                placeholder="template name"
                onChange={(e) => set({ map: binding.map!.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)) })}
                className="h-8 w-28 bg-card font-mono text-xs"
              />
              <span className="mt-1.5 text-xs text-muted-foreground">←</span>
              {fromEditor(m, (from) => set({ map: binding.map!.map((x, j) => (j === i ? { ...x, from } : x)) }))}
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-red-500"
                onClick={() => set({ map: binding.map!.filter((_, j) => j !== i) })}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[0.68rem] text-primary hover:text-teal-700"
            onClick={() => set({ map: [...(binding.map ?? []), { to: "", from: `{{${src.fields[0].key}}}` }] })}
          >
            <Plus className="h-3 w-3" /> Add mapping
          </Button>
        </div>
      )}
    </Row>
  );
}

const OP_LABEL: Record<DbFilter["op"], string> = { eq: "=", gte: "≥", lte: "≤", contains: "has" };

function FilterRow({
  src,
  filter,
  onChange,
  onRemove,
}: {
  src: DataSource;
  filter: DbFilter;
  onChange: (f: DbFilter) => void;
  onRemove: () => void;
}) {
  const field = src.fields.find((f) => f.key === filter.field);
  const ops: DbFilter["op"][] = field?.type === "number" ? ["eq", "gte", "lte"] : ["eq", "contains"];
  const useValueSelect = field?.type === "string" && filter.op === "eq";

  return (
    <div className="flex items-center gap-1.5">
      <Select value={filter.field} onValueChange={(v) => onChange({ field: v ?? "", op: "eq", value: "" })}>
        <SelectTrigger size="sm" className="w-28 bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {src.fields.map((f) => (
            <SelectItem key={f.key} value={f.key}>{f.key}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filter.op}
        items={Object.fromEntries(ops.map((o) => [o, OP_LABEL[o]]))}
        onValueChange={(v) => onChange({ ...filter, op: v as DbFilter["op"] })}
      >
        <SelectTrigger size="sm" className="w-16 bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ops.map((o) => (
            <SelectItem key={o} value={o}>{OP_LABEL[o]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {useValueSelect ? (
        <Select
          value={filter.value || NONE}
          items={{ [NONE]: "any", ...Object.fromEntries(distinctValues(src.key, filter.field).map((v) => [v, v])) }}
          onValueChange={(v) => onChange({ ...filter, value: !v || v === NONE ? "" : v })}
        >
          <SelectTrigger size="sm" className="flex-1 bg-card">
            <SelectValue placeholder="any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>any</SelectItem>
            {distinctValues(src.key, filter.field).map((v) => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          value={filter.value}
          placeholder="value"
          onChange={(e) => onChange({ ...filter, value: e.target.value })}
          className="h-8 flex-1 bg-card text-xs"
        />
      )}
      <Button variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground hover:text-red-500" onClick={onRemove}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function RowsPreview({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) {
    return <p className="rounded-md border border-dashed bg-card px-2 py-2 text-[0.68rem] text-muted-foreground">No rows match.</p>;
  }
  const cols = Object.keys(rows[0]);
  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-[0.68rem]">
          <thead>
            <tr className="bg-muted/60">
              {cols.map((c) => (
                <th key={c} className="whitespace-nowrap px-2 py-1 text-left font-semibold text-muted-foreground">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 5).map((r, i) => (
              <tr key={i} className="border-t">
                {cols.map((c) => (
                  <td key={c} className="whitespace-nowrap px-2 py-1 tabular-nums">{String(r[c] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t px-2 py-1 text-[0.62rem] text-muted-foreground">
        {rows.length} row{rows.length === 1 ? "" : "s"}{rows.length > 5 ? ` · showing first 5` : ""}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Context binding editor

export function CtxEditor({ path, onChange }: { path: string; onChange: (p: string) => void }) {
  const listId = useId();
  const resolved = path ? resolvePath(path, SAMPLE_CONTEXT) : undefined;
  return (
    <div className="space-y-1.5 rounded-lg border bg-muted/30 p-2.5">
      <Input
        value={path}
        list={listId}
        placeholder="result.scales.R"
        onChange={(e) => onChange(e.target.value)}
        className="h-8 bg-card font-mono text-xs"
      />
      <datalist id={listId}>
        {CONTEXT_PATHS.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <p className="text-[0.66rem] text-muted-foreground">
        Sample value:{" "}
        <code className="font-mono text-foreground">{resolved === undefined ? "—" : JSON.stringify(resolved)}</code>
      </p>
      <p className="text-[0.62rem] text-amber-600/90">
        Resolved from a sample context in the editor; at runtime this reads the viewer, their result, and the page filter panel.
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1 block text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
