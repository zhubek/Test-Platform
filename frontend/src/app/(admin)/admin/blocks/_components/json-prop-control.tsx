"use client";

// Editor for a `json` block prop. When the value is a flat array of records
// (objects of primitives / localized text), it renders a grid where each text
// cell carries the project's language chips and stores a Localized map — so the
// leaves are translatable while the structure stays language-neutral. Anything
// else (or via the toggle) falls back to a raw JSON textarea.

import { useMemo, useState } from "react";
import { Plus, Trash2, Braces, Table } from "lucide-react";
import { useContentLanguages } from "@/lib/project-context";
import type { Localized } from "@/lib/localized";
import { cn } from "@/lib/utils";

type Rec = Record<string, unknown>;

// A cell is a primitive or a Localized map (all-string values) — not a nested
// array/object (those can only be edited as raw JSON).
function isCellValue(c: unknown): boolean {
  if (c === null || ["string", "number", "boolean"].includes(typeof c)) return true;
  if (c && typeof c === "object" && !Array.isArray(c)) {
    return Object.values(c as Rec).every((x) => typeof x === "string");
  }
  return false;
}

/** The value as a flat record array (grid-editable), or null if it isn't one. */
function asRecords(v: unknown): Rec[] | null {
  if (!Array.isArray(v)) return null;
  if (v.length === 0) return [];
  const ok = v.every(
    (r) =>
      !!r &&
      typeof r === "object" &&
      !Array.isArray(r) &&
      Object.values(r as Rec).every(isCellValue),
  );
  return ok ? (v as Rec[]) : null;
}

function asMap(v: unknown): Localized {
  if (v && typeof v === "object" && !Array.isArray(v)) return { ...(v as Record<string, string>) };
  if (typeof v === "string") return v ? { en: v } : {};
  return {};
}

export function JsonPropControl({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const records = asRecords(value);
  const canGrid = records !== null;
  const [raw, setRaw] = useState(!canGrid);

  if (raw || !canGrid) {
    return (
      <RawJson
        value={value}
        onChange={onChange}
        onUseGrid={canGrid ? () => setRaw(false) : undefined}
      />
    );
  }

  return (
    <div>
      <div className="mb-1.5 flex justify-end">
        <button
          type="button"
          onClick={() => setRaw(true)}
          className="inline-flex items-center gap-1 text-[0.66rem] font-medium text-muted-foreground hover:text-foreground"
        >
          <Braces className="h-3 w-3" /> Raw JSON
        </button>
      </div>
      <RecordsGrid records={records} onChange={onChange} />
    </div>
  );
}

function RecordsGrid({ records, onChange }: { records: Rec[]; onChange: (v: Rec[]) => void }) {
  const columns = useMemo(() => {
    const cols: string[] = [];
    for (const r of records) for (const k of Object.keys(r)) if (!cols.includes(k)) cols.push(k);
    return cols;
  }, [records]);

  const setCell = (ri: number, col: string, val: unknown) =>
    onChange(records.map((r, i) => (i === ri ? { ...r, [col]: val } : r)));
  const addRow = () =>
    onChange([...records, Object.fromEntries(columns.map((c) => [c, {} as Localized]))]);
  const removeRow = (ri: number) => onChange(records.filter((_, i) => i !== ri));

  if (columns.length === 0) {
    return (
      <button
        type="button"
        onClick={() => onChange([{}])}
        className="inline-flex items-center gap-1.5 rounded-lg border-2 border-dashed px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> Add row
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="w-6" />
              {columns.map((c) => (
                <th
                  key={c}
                  className="px-2 py-1 font-mono text-[0.64rem] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {c}
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {records.map((row, ri) => (
              <tr key={ri} className="border-b last:border-0 align-top">
                <td className="px-1 py-1 text-center text-[0.6rem] font-bold text-muted-foreground/40">
                  {ri + 1}
                </td>
                {columns.map((col) => (
                  <td key={col} className="px-2 py-1.5">
                    <Cell value={row[col]} onChange={(v) => setCell(ri, col, v)} />
                  </td>
                ))}
                <td className="px-1 py-1">
                  <button
                    type="button"
                    onClick={() => removeRow(ri)}
                    className="text-muted-foreground/50 hover:text-red-500"
                    title="Remove row"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1.5 rounded-lg border-2 border-dashed px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> Add row
      </button>
    </div>
  );
}

// One cell: numbers/booleans get a plain control; everything else is treated as
// translatable text (a Localized map with language chips).
function Cell({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  if (typeof value === "number") {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-7 w-24 rounded border px-1.5 text-xs outline-none focus:border-ring"
      />
    );
  }
  if (typeof value === "boolean") {
    return (
      <select
        value={String(value)}
        onChange={(e) => onChange(e.target.value === "true")}
        className="h-7 rounded border px-1.5 text-xs outline-none focus:border-ring"
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }
  return <LocalizedCell value={value} onChange={onChange} />;
}

function LocalizedCell({ value, onChange }: { value: unknown; onChange: (v: Localized) => void }) {
  const map = asMap(value);
  const { codes, default: defaultLang } = useContentLanguages();
  const [lang, setLang] = useState(defaultLang);
  const activeLang = codes.includes(lang) ? lang : codes[0];
  return (
    <div className="min-w-[9rem] space-y-0.5">
      <div className="flex items-center gap-0.5">
        {codes.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            className={cn(
              "rounded px-1 py-0.5 text-[0.55rem] font-bold uppercase transition-colors",
              activeLang === code ? "bg-primary/10 text-primary" : "text-muted-foreground/40 hover:text-muted-foreground",
            )}
          >
            {code}
            {code !== activeLang && !map[code] && (
              <span className="ml-0.5 inline-block h-1 w-1 rounded-full bg-amber-400 align-middle" />
            )}
          </button>
        ))}
      </div>
      <input
        value={map[activeLang] ?? ""}
        onChange={(e) => onChange({ ...map, [activeLang]: e.target.value })}
        className="h-7 w-full rounded border px-1.5 text-xs outline-none focus:border-ring"
      />
    </div>
  );
}

// Raw JSON textarea — keeps half-typed input local, commits only on valid parse.
function RawJson({
  value,
  onChange,
  onUseGrid,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  onUseGrid?: () => void;
}) {
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
      {onUseGrid && (
        <div className="mb-1.5 flex justify-end">
          <button
            type="button"
            onClick={onUseGrid}
            className="inline-flex items-center gap-1 text-[0.66rem] font-medium text-muted-foreground hover:text-foreground"
          >
            <Table className="h-3 w-3" /> Table editor
          </button>
        </div>
      )}
      <textarea
        value={text}
        spellCheck={false}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          try {
            onChange(JSON.parse(next));
            setError(null);
          } catch (err) {
            setError((err as Error).message);
          }
        }}
        className="h-40 w-full resize-y rounded-md border bg-gray-50 p-2 font-mono text-[0.72rem] leading-relaxed outline-none focus:border-ring"
      />
      {error ? (
        <p className="mt-1 text-[0.66rem] text-red-500">Invalid JSON: {error}</p>
      ) : (
        <p className="mt-1 text-[0.66rem] text-muted-foreground">
          e.g. <code className="font-mono">{`[{ "name": "R", "value": 72 }]`}</code>
        </p>
      )}
    </div>
  );
}
