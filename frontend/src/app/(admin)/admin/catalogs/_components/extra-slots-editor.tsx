"use client";

// Controlled inline editor for a catalog group's extra-variable slot list.
// Each slot has a name, a value type, and — when the group is public — a flag
// for whether it appears as a filter on the public site.
// Used by the group's Parameters tab and by the "New catalog" dialog.

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale-context";
import type { ExtraSlot } from "@/lib/catalog-extras";
import type { VarType } from "@/lib/dc-catalogs";

const VAR_TYPES: { value: VarType; labelKey: string }[] = [
  { value: "text", labelKey: "admin.catCfg.typeText" },
  { value: "number", labelKey: "admin.catCfg.typeNumber" },
  { value: "boolean", labelKey: "admin.catCfg.typeBoolean" },
  { value: "date", labelKey: "admin.catCfg.typeDate" },
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
  const { t } = useLocale();
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
        <p className="text-xs text-gray-400">{t("admin.catCfg.noExtraVariables")}</p>
      )}
      {value.map((slot, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="flex w-5 shrink-0 items-center justify-center text-[0.6rem] font-bold text-gray-300"
            title={i < 5 ? t("admin.catCfg.shownAsColumn") : undefined}
          >
            {i + 1}
          </span>
          <input
            type="text"
            value={slot.varName}
            onChange={(e) => patch(i, { varName: e.target.value })}
            placeholder={t("admin.catCfg.variableNamePlaceholder")}
            className="h-8 flex-1 rounded-md border border-gray-200 px-2.5 font-mono text-xs text-gray-900 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          <select
            value={slot.type}
            onChange={(e) => patch(i, { type: e.target.value as VarType })}
            className="h-8 shrink-0 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            title={t("admin.catCfg.valueType")}
          >
            {VAR_TYPES.map((vt) => (
              <option key={vt.value} value={vt.value}>
                {t(vt.labelKey)}
              </option>
            ))}
          </select>
          {showFilterable && (
            <label
              className="flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md border border-gray-200 px-2 text-[0.7rem] font-medium text-gray-500"
              title={t("admin.catCfg.showAsFilterHint")}
            >
              <input
                type="checkbox"
                checked={slot.filterable}
                onChange={(e) => patch(i, { filterable: e.target.checked })}
                className="h-3.5 w-3.5 accent-teal-600"
              />
              {t("admin.catCfg.filter")}
            </label>
          )}
          <Button variant="ghost" size="icon-xs" onClick={() => move(i, -1)} disabled={i === 0} title={t("admin.catCfg.moveUp")}>
            ↑
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => move(i, 1)} disabled={i === value.length - 1} title={t("admin.catCfg.moveDown")}>
            ↓
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="text-muted-foreground hover:text-red-500"
            title={t("admin.catCfg.removeVariable")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      <button
        onClick={() => onChange([...value, { varName: "", type: "text", filterable: false }])}
        className="mt-1 inline-flex items-center gap-1.5 rounded-lg border-2 border-dashed border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-teal-300 hover:text-teal-600"
      >
        <Plus className="h-3.5 w-3.5" /> {t("admin.catCfg.addVariable")}
      </button>
    </div>
  );
}
