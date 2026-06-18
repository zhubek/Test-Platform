// Date-range presets for date pickers. Each preset computes a { from, to } pair
// as YYYY-MM-DD strings (the value format <input type="date"> uses), relative to
// today. Pure date math — no dependencies.

export interface DateRange {
  from: string;
  to: string;
}

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export type PresetKey =
  | "today"
  | "last7"
  | "last30"
  | "last90"
  | "thisMonth"
  | "lastMonth"
  | "thisYear";

export const DATE_PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "last90", label: "Last 90 days" },
  { key: "thisMonth", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "thisYear", label: "This year" },
];

/** Resolve a preset to a concrete { from, to } range ending at (or within) today. */
export function presetRange(key: PresetKey): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d;
  };

  switch (key) {
    case "today":
      return { from: fmt(today), to: fmt(today) };
    case "last7":
      return { from: fmt(daysAgo(6)), to: fmt(today) };
    case "last30":
      return { from: fmt(daysAgo(29)), to: fmt(today) };
    case "last90":
      return { from: fmt(daysAgo(89)), to: fmt(today) };
    case "thisMonth":
      return { from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), to: fmt(today) };
    case "lastMonth": {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0); // day 0 = last day of prev month
      return { from: fmt(first), to: fmt(last) };
    }
    case "thisYear":
      return { from: fmt(new Date(today.getFullYear(), 0, 1)), to: fmt(today) };
  }
}
