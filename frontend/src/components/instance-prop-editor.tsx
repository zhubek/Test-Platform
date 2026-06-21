"use client";

// Per-prop editor for a view-block instance — shared by the Result View tab and
// the Dashboard constructor. Text/number props bind inline; collection props use
// a rows table where each cell takes inline {{variables}} (Static), or a Database
// query. `groups`/`scope` supply the variable picker + live preview values.

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { modeOf, type StoredValue } from "@/lib/question-instances";
import type { BlockProp } from "@/lib/backend";
import { emptyDbBinding, type DbBinding } from "@/lib/mock-sources";
import {
  DbEditor,
  ExprInput,
  ModeToggle,
  type ExprVarGroup,
  type PropMode,
} from "@/components/prop-source";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function InstancePropEditor({
  def,
  value,
  scope,
  groups,
  onChange,
}: {
  def: BlockProp;
  value: StoredValue;
  scope: Record<string, unknown>;
  groups: ExprVarGroup[];
  onChange: (v: StoredValue) => void;
}) {
  const mode = modeOf(value);
  const isCollection = def.type === "json" || def.type === "list";
  // Collections have only two forms — Static (rows, with {{variables}} per cell)
  // or Database. They never use the number-only Expression form, so a legacy
  // {$expr}/{$ctx} value is shown as Static (the rows editor seeds from sample).
  const effMode: PropMode = isCollection ? (mode === "db" ? "db" : "static") : mode;

  const setMode = (m: PropMode) => {
    if (m === effMode) return;
    if (m === "db") onChange({ $db: emptyDbBinding() });
    else if (m === "expr") onChange({ $expr: "" });
    else onChange(def.value);
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="block text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {def.name}
        </label>
        {isCollection ? (
          <ModeToggle mode={effMode} onChange={setMode} modes={["static", "db"]} />
        ) : def.type === "number" ? (
          <ModeToggle mode={mode === "ctx" ? "static" : mode} onChange={setMode} modes={["static", "expr"]} />
        ) : null}
      </div>

      {effMode === "db" && (
        <DbEditor
          binding={(value as { $db: DbBinding }).$db}
          scalar={!isCollection}
          onChange={(b) => onChange({ $db: b })}
        />
      )}
      {effMode === "expr" && (
        <ExprInput
          bare
          value={(value as { $expr: string }).$expr}
          scope={scope}
          groups={groups}
          placeholder="e.g. round(realistic)"
          onChange={(expr) => onChange({ $expr: expr })}
        />
      )}
      {effMode === "static" && (
        <StaticControl def={def} value={value} scope={scope} groups={groups} onChange={onChange} />
      )}
    </div>
  );
}

// Static controls. Text carries inline {{variables}} via ExprInput; other
// primitives use plain controls; collections use the rows table.
function StaticControl({
  def,
  value,
  scope,
  groups,
  onChange,
}: {
  def: BlockProp;
  value: StoredValue;
  scope: Record<string, unknown>;
  groups: ExprVarGroup[];
  onChange: (v: StoredValue) => void;
}) {
  if (def.type === "text") {
    return (
      <ExprInput
        value={typeof value === "string" ? value : ""}
        scope={scope}
        groups={groups}
        onChange={(v) => onChange(v)}
      />
    );
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
  if (def.type === "color") {
    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={String(value ?? "#0d9488")}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border"
        />
        <Input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className="h-8 w-28 font-mono text-xs" />
      </div>
    );
  }
  if (def.type === "boolean") {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cn(
          "rounded-md border px-3 py-1.5 text-xs font-medium",
          value ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
        )}
      >
        {value ? "true" : "false"}
      </button>
    );
  }
  return (
    <CollectionRowsEditor
      value={value}
      fallbackSample={def.value}
      scope={scope}
      groups={groups}
      onChange={onChange}
    />
  );
}

// An array whose every item is a flat object (primitive-valued fields only).
function isFlatRowArray(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every(
      (r) =>
        r != null &&
        typeof r === "object" &&
        !Array.isArray(r) &&
        Object.values(r as object).every((x) => x === null || typeof x !== "object"),
    )
  );
}

const cellToInput = (v: unknown): string => (v == null ? "" : typeof v === "string" ? v : String(v));

// Keep the type for plain literals (numbers stay numbers); keep the raw string
// when it carries {{expressions}} — deepInterpolate resolves a lone {{expr}}
// back to its typed value at render.
function coerceCell(input: string): unknown {
  const t = input.trim();
  if (t === "") return "";
  if (t.includes("{{")) return input;
  if (t === "true") return true;
  if (t === "false") return false;
  if (t === "null") return null;
  if (/^-?\d*\.?\d+$/.test(t)) return Number(t);
  return input;
}

function CollectionRowsEditor({
  value,
  fallbackSample,
  scope,
  groups,
  onChange,
}: {
  value: StoredValue;
  fallbackSample: unknown;
  scope: Record<string, unknown>;
  groups: ExprVarGroup[];
  onChange: (v: StoredValue) => void;
}) {
  const stored = Array.isArray(value) ? (value as Record<string, unknown>[]) : null;
  const sample = Array.isArray(fallbackSample) ? (fallbackSample as Record<string, unknown>[]) : [];
  const rows = stored && stored.length ? stored : sample;
  const tabular = isFlatRowArray(rows);

  const columns = useMemo(() => {
    const cols: string[] = [];
    for (const r of rows as unknown[]) {
      if (r && typeof r === "object" && !Array.isArray(r)) {
        for (const k of Object.keys(r as object)) if (!cols.includes(k)) cols.push(k);
      }
    }
    return cols;
  }, [rows]);

  if (!tabular || columns.length === 0) {
    return <JsonControl value={value} onChange={onChange} />;
  }

  const setCell = (ri: number, col: string, input: string) =>
    onChange(rows.map((r, i) => (i === ri ? { ...r, [col]: coerceCell(input) } : r)));
  const addRow = () => onChange([...rows, Object.fromEntries(columns.map((c) => [c, ""]))]);
  const removeRow = (ri: number) => onChange(rows.filter((_, i) => i !== ri));

  return (
    <div className="space-y-1.5">
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted/50">
              {columns.map((c) => (
                <th key={c} className="px-2 py-1 text-left font-mono text-[0.66rem] font-semibold text-muted-foreground">
                  {c}
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className="border-t align-top">
                {columns.map((c) => (
                  <td key={c} className="p-1">
                    <ExprInput
                      value={cellToInput(r?.[c])}
                      scope={scope}
                      groups={groups}
                      onChange={(v) => setCell(ri, c, v)}
                    />
                  </td>
                ))}
                <td className="p-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-red-500"
                    onClick={() => removeRow(ri)}
                    title="Remove row"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={addRow}
        className="h-6 px-1.5 text-[0.68rem] text-primary hover:text-teal-700"
      >
        <Plus className="h-3 w-3" /> Add row
      </Button>
    </div>
  );
}

function JsonControl({ value, onChange }: { value: StoredValue; onChange: (v: StoredValue) => void }) {
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
        className="h-28 w-full resize-y rounded-md border bg-gray-50 p-2 font-mono text-[0.72rem] leading-relaxed outline-none focus:border-ring"
      />
      {error && <p className="mt-1 text-[0.66rem] text-red-500">Invalid JSON: {error}</p>}
    </div>
  );
}
