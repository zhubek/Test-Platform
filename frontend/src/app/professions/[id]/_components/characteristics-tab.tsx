"use client";

import type { CharacteristicsData, CharacteristicFitItem } from "../../_components/mock-data";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import type { Locale } from "@/lib/i18n";

const sectionI18nKeys: Record<string, string> = {
  interests: "fit.interest",
  personality: "fit.personality",
  skills: "fit.skills",
  values: "fit.values",
};

const SECTION_KEYS = ["interests", "personality", "skills", "values"] as const;

interface Props {
  data: CharacteristicsData;
}

export function CharacteristicsTab({ data }: Props) {
  const { t, locale } = useLocale();

  return (
    <div className="space-y-8">
      {SECTION_KEYS.map((key) => {
        const items = data[key];
        if (!items || items.length === 0) return null;
        return (
          <div key={key}>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              {t(sectionI18nKeys[key])}
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <BarRow key={i} item={item} index={i} locale={locale} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BarRow({
  item,
  index,
  locale,
}: {
  item: CharacteristicFitItem;
  index: number;
  locale: Locale;
}) {
  const barColor =
    item.level >= 70
      ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
      : item.level >= 40
        ? "bg-gradient-to-r from-amber-400 to-amber-500"
        : "bg-gradient-to-r from-red-400 to-red-500";

  return (
    <div className="group/bar relative">
      <div
        className="flex items-center gap-3 animate-fade-up"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <div className="w-[120px] md:w-[140px] shrink-0 text-right">
          <span className="text-[0.82rem] font-medium text-gray-700">
            {localize(item.name, locale)}
          </span>
        </div>
        <div className="flex-1 h-7 rounded-md bg-gray-100 overflow-hidden">
          <div
            className={`animate-bar-fill h-full rounded-md ${barColor}`}
            style={{
              width: `${item.level}%`,
              animationDelay: `${index * 80 + 200}ms`,
            }}
          />
        </div>
        <span className="w-[40px] shrink-0 text-right text-[0.82rem] font-semibold text-gray-700">
          {item.level}%
        </span>
      </div>
      {/* Tooltip on hover */}
      {localize(item.desc, locale) && (
        <div className="pointer-events-none invisible group-hover/bar:visible absolute -top-1 left-[140px] -translate-y-full z-20 w-[240px] rounded-lg bg-gray-900 px-3 py-2 text-[0.75rem] leading-relaxed text-white shadow-lg">
          {localize(item.desc, locale)}
          <span className="absolute top-full left-6 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
