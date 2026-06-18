"use client";

// A date-range picker with quick presets. Picking a preset (Last 7 days, This
// month, …) auto-fills both `from` and `to`; the two date inputs stay editable
// for a custom range. Use <DateRangePicker> for the full control, or
// <DateRangePresets> to add just the presets dropdown next to existing inputs.

import { CalendarRange } from "lucide-react";
import { DATE_PRESETS, presetRange, type PresetKey } from "@/lib/date-presets";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DATE_INPUT =
  "rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 bg-white outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

/** Just the presets dropdown — calls onPick with the resolved range. */
export function DateRangePresets({
  onPick,
  className,
}: {
  onPick: (from: string, to: string) => void;
  className?: string;
}) {
  return (
    <Select
      // Always reset to the placeholder: a preset is an action, not a bound value
      // (the user can edit the dates afterwards, which would otherwise desync).
      value={null}
      items={Object.fromEntries(DATE_PRESETS.map((p) => [p.key, p.label]))}
      onValueChange={(v) => {
        if (!v) return;
        const { from, to } = presetRange(v as PresetKey);
        onPick(from, to);
      }}
    >
      <SelectTrigger size="sm" className={cn("h-8 w-[8.5rem] bg-white text-xs", className)}>
        <CalendarRange className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
        <SelectValue placeholder="Presets" />
      </SelectTrigger>
      <SelectContent>
        {DATE_PRESETS.map((p) => (
          <SelectItem key={p.key} value={p.key}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Full control: presets dropdown + from/to date inputs. */
export function DateRangePicker({
  from,
  to,
  onChange,
  label,
  className,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {label && <span className="whitespace-nowrap text-[0.72rem] font-medium text-gray-400">{label}:</span>}
      <DateRangePresets onPick={onChange} />
      <input type="date" value={from} max={to || undefined} onChange={(e) => onChange(e.target.value, to)} className={DATE_INPUT} />
      <span className="text-[0.65rem] text-gray-300">—</span>
      <input type="date" value={to} min={from || undefined} onChange={(e) => onChange(from, e.target.value)} className={DATE_INPUT} />
    </div>
  );
}
