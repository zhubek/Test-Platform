"use client";

import { useLocale } from "@/lib/locale-context";

export type SortKey = "overall" | "interest" | "personality" | "skills" | "values";

const OPTION_KEYS: { value: SortKey; i18nKey: string }[] = [
  { value: "overall", i18nKey: "professions.sort.overall" },
  { value: "interest", i18nKey: "professions.sort.interest" },
  { value: "personality", i18nKey: "professions.sort.personality" },
  { value: "skills", i18nKey: "professions.sort.skills" },
  { value: "values", i18nKey: "professions.sort.values" },
];

interface Props {
  value: SortKey;
  onChange: (v: SortKey) => void;
  hidden?: boolean;
}

export function SortBar({ value, onChange, hidden }: Props) {
  const { t } = useLocale();

  if (hidden) return null;

  return (
    <div className="flex items-center gap-2.5 pb-4">
      <label className="text-[0.8rem] text-gray-400 whitespace-nowrap">
        {t("professions.sort.label")}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="text-[0.82rem] py-1 px-2.5 border border-gray-200 rounded-md bg-white text-gray-700 cursor-pointer"
      >
        {OPTION_KEYS.map((o) => (
          <option key={o.value} value={o.value}>
            {t(o.i18nKey)}
          </option>
        ))}
      </select>
    </div>
  );
}
