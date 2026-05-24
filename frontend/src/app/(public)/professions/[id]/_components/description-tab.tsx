"use client";

import type { DescriptionData } from "../../_components/mock-data";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";

interface Props {
  data: DescriptionData;
  onSkillClick?: (skill: string) => void;
}

export function DescriptionTab({ data, onSkillClick }: Props) {
  const { t, locale } = useLocale();

  return (
    <div className="space-y-5">
      {/* Intro card */}
      <div
        className="bg-gradient-to-br from-blue-50/60 to-white border-l-4 border-l-blue-600 border border-black/[0.04] rounded-2xl p-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_4px_14px_-2px_rgb(0_0_0/0.05)] animate-stagger-fade-up"
        style={{ "--stagger-index": 0 } as React.CSSProperties}
      >
        <h3 className="text-base font-bold text-gray-900 mb-2">
          {t("professionDetail.whatIs").replace("{title}", localize(data.title, locale))}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {localize(data.intro, locale)}
        </p>
      </div>

      {/* Responsibilities + Typical Day */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-stagger-fade-up"
        style={{ "--stagger-index": 1 } as React.CSSProperties}
      >
        <DescCard accent="bg-blue-600" title={t("professionDetail.responsibilities")}>
          <ul className="space-y-1.5 ml-4">
            {data.responsibilities.map((r, i) => (
              <li
                key={i}
                className="text-sm text-gray-600 leading-relaxed list-disc"
              >
                {localize(r, locale)}
              </li>
            ))}
          </ul>
        </DescCard>

        <DescCard accent="bg-violet-600" title={t("professionDetail.typicalDay")}>
          <ul className="space-y-2">
            {data.typicalDay.map((d, i) => (
              <li key={i} className="text-sm text-gray-600 leading-relaxed">
                <strong className="text-gray-700">{localize(d.period, locale)}:</strong> {localize(d.text, locale)}
              </li>
            ))}
          </ul>
        </DescCard>
      </div>

      {/* Required Skills */}
      <div
        className="animate-stagger-fade-up"
        style={{ "--stagger-index": 2 } as React.CSSProperties}
      >
        <DescCard accent="bg-emerald-600" title={t("professionDetail.requiredSkills")}>
          <div className="flex flex-wrap gap-2 mt-1">
            {data.requiredSkills.map((s) => (
              <button
                key={localize(s.label, locale)}
                onClick={() => onSkillClick?.(s.label.en)}
                className={
                  "text-xs font-semibold px-2.5 py-1 rounded-full transition-all " +
                  s.color +
                  (onSkillClick
                    ? " cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-emerald-300"
                    : "")
                }
              >
                {localize(s.label, locale)}
              </button>
            ))}
          </div>
          {onSkillClick && (
            <p className="text-[0.6875rem] text-gray-400 mt-2">
              {t("professionDetail.skillHint")}
            </p>
          )}
        </DescCard>
      </div>

      {/* Work Environment + Specializations */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-stagger-fade-up"
        style={{ "--stagger-index": 3 } as React.CSSProperties}
      >
        <DescCard accent="bg-pink-600" title={t("professionDetail.workEnvironment")}>
          {data.workEnvironment.map((p, i) => (
            <p
              key={i}
              className="text-sm text-gray-600 leading-relaxed mb-2 last:mb-0"
            >
              {localize(p, locale)}
            </p>
          ))}
        </DescCard>

        <DescCard accent="bg-sky-700" title={t("professionDetail.specializations")}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-sm font-semibold text-gray-600 py-1.5 pr-3 bg-gray-50/50">
                  {t("professionDetail.specPath")}
                </th>
                <th className="text-sm font-semibold text-gray-600 py-1.5 bg-gray-50/50">
                  {t("professionDetail.specTools")}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.specializations.map((s) => (
                <tr key={localize(s.path, locale)} className="border-b border-gray-50">
                  <td className="text-sm text-gray-600 py-1.5 pr-3">
                    {localize(s.path, locale)}
                  </td>
                  <td className="text-sm text-gray-500 py-1.5">
                    {localize(s.tools, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DescCard>
      </div>
    </div>
  );
}

function DescCard({
  accent,
  title,
  children,
}: {
  accent: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 relative overflow-hidden shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_4px_14px_-2px_rgb(0_0_0/0.05)] hover-lift">
      <div className={`w-10 h-1 rounded-full ${accent} mb-3.5`} />
      <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
      {children}
    </div>
  );
}
