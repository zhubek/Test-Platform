"use client";

import type { ProfessionData, ProfessionGroup } from "./mock-data";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";

const groupColors: Record<ProfessionGroup, string> = {
  Technology: "bg-blue-100 text-blue-800",
  Healthcare: "bg-emerald-100 text-emerald-800",
  Education: "bg-amber-50 text-amber-800",
  Business: "bg-violet-100 text-violet-700",
  "Creative Arts": "bg-pink-100 text-pink-800",
  Science: "bg-sky-100 text-sky-700",
};

const FIT_KEYS = ["interest", "personality", "skills", "values"] as const;

const fitColorMap: Record<string, string> = {
  interest: "bg-blue-50 text-blue-600",
  personality: "bg-violet-50 text-violet-600",
  skills: "bg-emerald-50 text-emerald-700",
  values: "bg-pink-50 text-pink-700",
};

const fitI18nKeys: Record<string, string> = {
  interest: "fit.interest",
  personality: "fit.personality",
  skills: "fit.skills",
  values: "fit.values",
};

interface Props {
  profession: ProfessionData;
  index: number;
}

export function ProfessionCard({ profession, index }: Props) {
  const { t, locale } = useLocale();

  return (
    <div
      className="animate-fade-up flex flex-col rounded-2xl border border-black/[0.04] bg-white p-4 md:p-5"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <h3 className="text-[0.88rem] font-semibold text-gray-900">
          {localize(profession.title, locale)}
        </h3>
        <span className="text-[0.72rem] text-gray-400">{profession.code}</span>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <span
          className={
            "rounded-full px-2.5 py-0.5 text-[0.62rem] font-semibold " +
            groupColors[profession.group]
          }
        >
          {profession.group}
        </span>
        {profession.popular && (
          <span className="rounded-full bg-amber-50 border border-amber-100/60 px-2 py-0.5 text-[0.62rem] font-semibold text-amber-700">
            {t("professions.card.popular")}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-[0.78rem] leading-relaxed text-gray-500 mb-3">
        {localize(profession.desc, locale)}
      </p>

      {/* Fit scores */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {FIT_KEYS.map((key) => {
          const score = profession.fit[key as keyof typeof profession.fit];
          if (score == null) return null;
          return (
            <span
              key={key}
              className={
                "rounded-md px-2 py-0.5 text-[0.65rem] font-medium " + fitColorMap[key]
              }
            >
              {t(fitI18nKeys[key])}: {score}%
            </span>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-auto pt-1">
        <a
          href="/professions"
          className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[0.75rem] font-medium text-gray-600 transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98]"
        >
          {t("professions.card.details")}
        </a>
      </div>
    </div>
  );
}
