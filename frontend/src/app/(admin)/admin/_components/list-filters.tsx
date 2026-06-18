"use client";

import { Search, X } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { DateRangePresets } from "@/components/date-range-picker";

interface DateFilter {
  label: string;
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}

interface StatusOption {
  value: string;
  label: string;
}

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  statusFilter?: string;
  onStatusChange?: (v: string) => void;
  statusOptions?: StatusOption[];
  dateFilters?: DateFilter[];
}

export function ListFilters({
  search,
  onSearchChange,
  searchPlaceholder,
  statusFilter,
  onStatusChange,
  statusOptions,
  dateFilters,
}: Props) {
  const { t } = useLocale();
  const hasDateFilters = dateFilters?.some((d) => d.from || d.to) ?? false;
  const hasFilters = search !== "" || (statusFilter ?? "") !== "" || hasDateFilters;

  return (
    <div className="flex flex-col gap-2.5 mb-5">
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder ?? t("cm.filters.searchPlaceholder")}
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
          />
        </div>

        {onStatusChange && (
          <select
            value={statusFilter ?? ""}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
          >
            <option value="">{t("filter.allStatuses")}</option>
            {(statusOptions ?? [
              { value: "published", label: t("cm.status.published") },
              { value: "draft", label: t("cm.status.draft") },
            ]).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        {hasFilters && (
          <button
            onClick={() => {
              onSearchChange("");
              onStatusChange?.("");
              dateFilters?.forEach((d) => { d.onFromChange(""); d.onToChange(""); });
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors px-2"
          >
            <X className="w-3 h-3" />
            {t("filter.clear")}
          </button>
        )}
      </div>

      {dateFilters && dateFilters.length > 0 && (
        <div className="flex flex-wrap gap-2.5">
          {dateFilters.map((df) => (
            <div key={df.label} className="flex items-center gap-1.5">
              <span className="text-[0.72rem] text-gray-400 font-medium whitespace-nowrap">{df.label}:</span>
              <DateRangePresets
                onPick={(from, to) => {
                  df.onFromChange(from);
                  df.onToChange(to);
                }}
              />
              <input
                type="date"
                value={df.from}
                max={df.to || undefined}
                onChange={(e) => df.onFromChange(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              />
              <span className="text-[0.65rem] text-gray-300">—</span>
              <input
                type="date"
                value={df.to}
                min={df.from || undefined}
                onChange={(e) => df.onToChange(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
