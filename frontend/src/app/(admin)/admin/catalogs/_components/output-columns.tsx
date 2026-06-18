"use client";

// Shared table cells rendering a catalog group's EXTRA VARIABLES as columns —
// the first five slots, in order. Used by every catalog list table: title
// column first, then these. Slots are managed on the group's Parameters tab.

import { useLocale } from "@/lib/locale-context";
import { localize, type Localized } from "@/lib/localized";
import { useExtraSlots } from "@/lib/catalog-extras";

const TH = "py-2.5 px-4 text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider";
const VISIBLE = 5;

export function OutputHeaderCells({ type }: { type: string }) {
  const slots = useExtraSlots(type);
  return (
    <>
      {slots.slice(0, VISIBLE).map((name) => (
        <th key={name} className={TH}>
          {name}
        </th>
      ))}
    </>
  );
}

export function OutputRowCells({
  type,
  output,
}: {
  type: string;
  output?: Record<string, Localized> | null;
}) {
  const { locale } = useLocale();
  const loc = locale as "en" | "ru" | "kk";
  const slots = useExtraSlots(type);
  return (
    <>
      {slots.slice(0, VISIBLE).map((name) => {
        const v = output?.[name];
        const text = v ? localize(v, loc) : "";
        return (
          <td key={name} className="px-4 py-3 text-sm text-gray-600">
            {text || <span className="text-gray-300">—</span>}
          </td>
        );
      })}
    </>
  );
}
