"use client";

import { useLocale } from "@/lib/locale-context";
import { type Localized } from "@/lib/localized";
import { type CatalogType, outputFields } from "@/lib/catalog-output";
import { LocalizedInput } from "./localized-input";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

const empty: Localized = { en: "", ru: "", kz: "" };

interface Props {
  type: CatalogType;
  // current values keyed by output field id
  output: Record<string, Localized>;
  onChange: (next: Record<string, Localized>) => void;
  onBlur?: () => void;
}

// Standard last tab on every catalog detail page: the per-item output
// variables (single texts) that are pickable when building dashboards.
export function OutputVariablesTab({ type, output, onChange, onBlur }: Props) {
  const { t, locale } = useLocale();
  const loc = locale as "en" | "ru" | "kz";
  const fields = outputFields(type);

  function set(id: string, val: Localized) {
    onChange({ ...output, [id]: val });
  }

  return (
    <div className="max-w-2xl">
      <p className="mb-5 text-[0.78rem] text-gray-500">
        {t("cm.methodic.output.hint")}
      </p>
      <div
        className="space-y-4"
        onBlur={(e) => {
          if (onBlur && !e.currentTarget.contains(e.relatedTarget)) onBlur();
        }}
      >
        {fields.map((f) => (
          <div key={f.id}>
            <label className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wider text-gray-400">
              {f.label[loc] || f.label.en}
            </label>
            <LocalizedInput
              value={output[f.id] ?? empty}
              onChange={(val) => set(f.id, val)}
              className={inputClass}
            />
          </div>
        ))}
        {fields.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-400">
            {t("cm.methodic.output.none")}
          </div>
        )}
      </div>
    </div>
  );
}
