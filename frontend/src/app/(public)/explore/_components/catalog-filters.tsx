"use client";

// Filter sidebar for a public catalog group. Controls are derived from the
// group's `filterable` variables, one control per variable type:
//   text → search box · number → min/max range · boolean → yes/no · date → range
// Filtering runs client-side over each item's extra-variable values.

import { localize, type Localized } from "@/lib/localized";
import type { CatalogCardEntry, CatalogFilterDef } from "@/lib/public-catalog";

export interface FilterValue {
  text?: string;
  min?: string;
  max?: string;
  bool?: "" | "yes" | "no";
  from?: string;
  to?: string;
}
export type FilterState = Record<string, FilterValue>;

const TRUEY = /^(yes|true|1|y|✓|да|иә|ия)/i;

function num(v: Localized | undefined, locale: string): number | null {
  if (!v) return null;
  const s = localize(v, locale).replace(/[^\d.\-]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** True when the state for one variable holds any active constraint. */
function isActive(f: CatalogFilterDef, fv: FilterValue | undefined): boolean {
  if (!fv) return false;
  switch (f.type) {
    case "text":
      return !!fv.text?.trim();
    case "number":
      return !!fv.min || !!fv.max;
    case "boolean":
      return !!fv.bool;
    case "date":
      return !!fv.from || !!fv.to;
    default:
      return false;
  }
}

export function applyCatalogFilters(
  cards: CatalogCardEntry[],
  filters: CatalogFilterDef[],
  state: FilterState,
  locale: string,
): CatalogCardEntry[] {
  if (filters.length === 0) return cards;
  return cards.filter((card) =>
    filters.every((f) => {
      const fv = state[f.varName];
      if (!isActive(f, fv)) return true;
      const raw = card.values[f.varName];
      const text = raw ? localize(raw, locale) : "";
      switch (f.type) {
        case "text":
          return text.toLowerCase().includes(fv!.text!.trim().toLowerCase());
        case "number": {
          const n = num(raw, locale);
          if (n === null) return false;
          const min = fv!.min ? Number(fv!.min) : null;
          const max = fv!.max ? Number(fv!.max) : null;
          if (min !== null && n < min) return false;
          if (max !== null && n > max) return false;
          return true;
        }
        case "boolean": {
          const truthy = TRUEY.test(text.trim());
          return fv!.bool === "yes" ? truthy : !truthy;
        }
        case "date": {
          const t = text ? Date.parse(text) : NaN;
          if (Number.isNaN(t)) return false;
          if (fv!.from && t < Date.parse(fv!.from)) return false;
          if (fv!.to && t > Date.parse(fv!.to)) return false;
          return true;
        }
        default:
          return true;
      }
    }),
  );
}

export function hasActiveFilters(filters: CatalogFilterDef[], state: FilterState): boolean {
  return filters.some((f) => isActive(f, state[f.varName]));
}

const inputClass =
  "w-full rounded-md border bg-background px-2.5 py-1.5 text-[0.82rem] text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary";

export function CatalogFilterSidebar({
  filters,
  state,
  onChange,
}: {
  filters: CatalogFilterDef[];
  state: FilterState;
  onChange: (next: FilterState) => void;
}) {
  if (filters.length === 0) return null;

  const set = (varName: string, patch: Partial<FilterValue>) =>
    onChange({ ...state, [varName]: { ...state[varName], ...patch } });

  const active = hasActiveFilters(filters, state);

  return (
    <aside className="w-full shrink-0 md:w-[220px] md:border-r md:pr-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[0.8rem] font-bold uppercase tracking-wider text-muted-foreground">
          Filters
        </h2>
        {active && (
          <button
            onClick={() => onChange({})}
            className="text-[0.72rem] font-medium text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-5">
        {filters.map((f) => {
          const fv = state[f.varName] ?? {};
          return (
            <div key={f.varName}>
              <div className="mb-1.5 font-mono text-[0.72rem] font-semibold uppercase tracking-wider text-muted-foreground">
                {f.varName}
              </div>

              {f.type === "text" && (
                <input
                  type="text"
                  value={fv.text ?? ""}
                  onChange={(e) => set(f.varName, { text: e.target.value })}
                  placeholder="Search…"
                  className={inputClass}
                />
              )}

              {f.type === "number" && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={fv.min ?? ""}
                    onChange={(e) => set(f.varName, { min: e.target.value })}
                    placeholder="Min"
                    className={inputClass}
                  />
                  <span className="text-xs text-muted-foreground">–</span>
                  <input
                    type="number"
                    value={fv.max ?? ""}
                    onChange={(e) => set(f.varName, { max: e.target.value })}
                    placeholder="Max"
                    className={inputClass}
                  />
                </div>
              )}

              {f.type === "boolean" && (
                <select
                  value={fv.bool ?? ""}
                  onChange={(e) => set(f.varName, { bool: e.target.value as FilterValue["bool"] })}
                  className={inputClass}
                >
                  <option value="">Any</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              )}

              {f.type === "date" && (
                <div className="space-y-1.5">
                  <input
                    type="date"
                    value={fv.from ?? ""}
                    onChange={(e) => set(f.varName, { from: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    type="date"
                    value={fv.to ?? ""}
                    onChange={(e) => set(f.varName, { to: e.target.value })}
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
