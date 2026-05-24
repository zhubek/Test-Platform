"use client";

import type { ProfessionData } from "./mock-data";
import { groupBadgeColors, groupBgColors } from "./mock-data";
import { Heart } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";

const FIT_KEYS = ["interest", "personality", "skills", "values"] as const;

const fitI18nKeys: Record<string, string> = {
  interest: "fit.interest",
  personality: "fit.personality",
  skills: "fit.skills",
  values: "fit.values",
};

const fitColors: Record<string, string> = {
  interest: "bg-blue-50 text-blue-700",
  personality: "bg-violet-50 text-violet-700",
  skills: "bg-emerald-50 text-emerald-700",
  values: "bg-pink-50 text-pink-700",
};

interface Props {
  profession: ProfessionData;
  onToggleLike: (id: number) => void;
  mode?: string;
  index: number;
}

export function ProfessionCard({ profession: p, onToggleLike, mode, index }: Props) {
  const { t, locale } = useLocale();

  const fitEntries = FIT_KEYS.filter(
    (k) => p.fit[k as keyof typeof p.fit] !== undefined,
  );

  const detailHref = `/professions/${p.id}${mode ? `?mode=${mode}` : ""}`;

  return (
    <div
      className="animate-fade-up bg-white border border-gray-200 rounded-xl p-5 flex flex-row gap-4 transition-all duration-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-start gap-2 mb-2.5 flex-wrap">
          <h3 className="text-[1.02rem] font-bold text-gray-900 leading-tight">
            {localize(p.title, locale)}
            <span className="text-[0.72rem] text-gray-400 font-normal ml-1.5">
              {p.code}
            </span>
          </h3>
          <button
            onClick={() => onToggleLike(p.id)}
            className={
              "ml-auto shrink-0 p-1 rounded-md transition-colors duration-150 " +
              (p.liked
                ? "text-red-500 hover:text-red-600"
                : "text-gray-300 hover:text-red-400")
            }
          >
            <Heart
              className="h-5 w-5"
              fill={p.liked ? "currentColor" : "none"}
            />
          </button>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
          <span
            className={
              "text-[0.68rem] px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap " +
              groupBadgeColors[p.group]
            }
          >
            {t(`professionDetail.group.${p.group}`)}
          </span>
          {p.popular && (
            <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold whitespace-nowrap">
              {t("professions.card.popular")}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-[0.84rem] text-gray-500 leading-relaxed mb-3">
          {localize(p.desc, locale)}
        </p>

        {/* Fit chips */}
        {fitEntries.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {fitEntries.map((key) => (
              <span
                key={key}
                className={
                  "text-[0.7rem] px-2 py-0.5 rounded font-medium whitespace-nowrap " +
                  fitColors[key]
                }
              >
                {t(fitI18nKeys[key])}: {p.fit[key as keyof typeof p.fit]}%
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto pt-1.5">
          <a
            href={detailHref}
            className="inline-block text-[0.82rem] px-4 py-1.5 rounded-lg border border-gray-200 text-gray-700 font-medium transition-all duration-150 hover:bg-gray-50 hover:border-gray-300"
          >
            {t("professions.card.details")}
          </a>
        </div>
      </div>

      {/* Icon */}
      <div
        className={
          "w-16 h-16 rounded-full shrink-0 flex items-center justify-center text-[1.6rem] self-center " +
          groupBgColors[p.group]
        }
      >
        {p.icon}
      </div>
    </div>
  );
}
