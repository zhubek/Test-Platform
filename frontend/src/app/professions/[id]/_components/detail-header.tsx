"use client";

import { ArrowLeft } from "lucide-react";
import type { ProfessionData } from "../../_components/mock-data";
import { groupBadgeColors } from "../../_components/mock-data";
import { ProfessionIllustration } from "./profession-illustration";
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
  backHref: string;
}

export function DetailHeader({ profession: p, backHref }: Props) {
  const { t, locale } = useLocale();

  const fitEntries = FIT_KEYS.filter(
    (k) => p.fit[k as keyof typeof p.fit] !== undefined,
  );

  return (
    <>
      <a
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("professionDetail.back")}
      </a>

      <div className="bg-white border border-black/[0.04] rounded-2xl p-7 mb-7 shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_4px_14px_-2px_rgb(0_0_0/0.05)] overflow-hidden">
        <div className="flex items-start gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">{localize(p.title, locale)}</h2>
              <span className="text-sm text-gray-400">{p.code}</span>
              <span
                className={
                  "text-xs px-2.5 py-0.5 rounded-full font-semibold " +
                  groupBadgeColors[p.group]
                }
              >
                {t(`professionDetail.group.${p.group}`)}
              </span>
              {p.popular && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                  {t("professions.card.popular")}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-3.5">
              {localize(p.desc, locale)}
            </p>
            {fitEntries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {fitEntries.map((key, i) => (
                  <span
                    key={key}
                    className={
                      "text-xs px-2.5 py-1 rounded-full font-medium animate-scale-in " +
                      fitColors[key]
                    }
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {t(fitI18nKeys[key])}: {p.fit[key as keyof typeof p.fit]}%
                  </span>
                ))}
              </div>
            )}
          </div>
          <ProfessionIllustration
            title={p.title.en}
            className="hidden sm:block w-40 h-32 shrink-0 opacity-80"
          />
        </div>
      </div>
    </>
  );
}
