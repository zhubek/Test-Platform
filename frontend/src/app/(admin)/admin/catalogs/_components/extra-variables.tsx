"use client";

// Extra variables on a catalog ITEM's General tab. The variable set (slots) is
// defined once per catalog GROUP — managed from the group's table (the ⚙ in
// the header). Here, inside Data Scientist / Registered Nurse / …, you only
// fill in the localized VALUES for those slots (stored in the item's `output`
// record, keyed by slot name).

import type { Localized } from "@/lib/localized";
import { useExtraSlots } from "@/lib/catalog-extras";
import { LocalizedInput } from "./localized-input";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

const emptyLoc: Localized = { en: "", ru: "", kk: "" };

interface Props {
  catalog: string;
  value: Record<string, Localized>;
  onChange: (v: Record<string, Localized>) => void;
  onBlur?: () => void;
}

export function ExtraVariables({ catalog, value, onChange, onBlur }: Props) {
  const slots = useExtraSlots(catalog);

  return (
    <div className="max-w-2xl">
      <div className="mb-1 mt-2 border-t border-gray-100 pt-5">
        <h3 className="text-[0.72rem] font-semibold uppercase tracking-wider text-gray-400">
          Extra variables
        </h3>
        <p className="mt-0.5 text-xs text-gray-400">
          The variable set is defined on the catalog group&apos;s table — here you fill
          in this item&apos;s values.
        </p>
      </div>

      {slots.length === 0 ? (
        <p className="pt-2 text-xs text-gray-300">
          No extra variables defined for this catalog group yet.
        </p>
      ) : (
        <div
          className="space-y-4 pt-2"
          onBlur={(e) => {
            if (onBlur && !e.currentTarget.contains(e.relatedTarget as Node)) onBlur();
          }}
        >
          {slots.map((name) => (
            <div key={name}>
              <label className="mb-1.5 block font-mono text-[0.72rem] font-semibold tracking-wider text-gray-400">
                {name}
              </label>
              <LocalizedInput
                value={value[name] ?? emptyLoc}
                onChange={(nv) => onChange({ ...value, [name]: nv })}
                placeholder="Value"
                className={inputClass}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
