"use client";

// Controlled inline editor for a catalog group's extra-variable slot list.
// Each slot has a name, a value type, and — when the group is public — a flag
// for whether it appears as a filter on the public site.
// Used by the group's Parameters tab and by the "New catalog" dialog.

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExtraSlot } from "@/lib/catalog-extras";
import type { VarType } from "@/lib/dc-catalogs";

const VAR_TYPES: { value: VarType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
];

export function ExtraSlotsEditor({
  value,
  onChange,
  showFilterable = false,
}: {
  value: ExtraSlot[];
  onChange: (v: ExtraSlot[]) => void;
  /** Show the per-variable "filter" toggle (only meaningful for public groups). */
  showFilterable?: boolean;
}) {
  const patch = (i: number, p: Partial<ExtraSlot>) =>
    onChange(value.map((s, j) => (j === i ? { ...s, ...p } : s)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      {value.length === 0 && (
        <p className="text-xs text-gray-400">No extra variables yet.</p>
      )}
      {value.map((slot, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="flex w-5 shrink-0 items-center justify-center text-[0.6rem] font-bold text-gray-300"
            title={i < 5 ? "Shown as a table column" : undefined}
          >
            {i + 1}
          </span>
          <input
            type="text"
            value={slot.varName}
            onChange={(e) => patch(i, { varName: e.target.value })}
            placeholder="variable_name"
            className="h-8 flex-1 rounded-md border border-gray-200 px-2.5 font-mono text-xs text-gray-900 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          <select
            value={slot.type}
            onChange={(e) => patch(i, { type: e.target.value as VarType })}
            className="h-8 shrink-0 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            title="Value type"
          >
            {VAR_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {showFilterable && (
            <label
              className="flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md border border-gray-200 px-2 text-[0.7rem] font-medium text-gray-500"
              title="Show as a filter on the public site"
            >
              <input
                type="checkbox"
                checked={slot.filterable}
                onChange={(e) => patch(i, { filterable: e.target.checked })}
                className="h-3.5 w-3.5 accent-teal-600"
              />
              Filter
            </label>
          )}
          <Button variant="ghost" size="icon-xs" onClick={() => move(i, -1)} disabled={i === 0} title="Move up">
            ↑
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => move(i, 1)} disabled={i === value.length - 1} title="Move down">
            ↓
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="text-muted-foreground hover:text-red-500"
            title="Remove variable"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      <button
        onClick={() => onChange([...value, { varName: "", type: "text", filterable: false }])}
        className="mt-1 inline-flex items-center gap-1.5 rounded-lg border-2 border-dashed border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-teal-300 hover:text-teal-600"
      >
        <Plus className="h-3.5 w-3.5" /> Add variable
      </button>
    </div>
  );
}
