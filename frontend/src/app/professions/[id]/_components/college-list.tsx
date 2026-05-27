"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { CollegeSpecData } from "../../_components/mock-data";
import { InstitutionInfoButton } from "./institution-tooltip";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";

interface Props {
  collegeSpecs: CollegeSpecData[];
}

export function CollegeList({ collegeSpecs }: Props) {
  const { t, locale } = useLocale();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {collegeSpecs.map((spec) => {
        const isOpen = openId === spec.id;
        return (
          <div
            key={spec.id}
            className={
              "bg-white border border-black/[0.04] rounded-2xl overflow-hidden transition-all duration-200 shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_4px_14px_-2px_rgb(0_0_0/0.05)] " +
              (isOpen ? "shadow-[0_4px_20px_-4px_rgb(0_0_0/0.1)]" : "")
            }
          >
            <button
              onClick={() => setOpenId(isOpen ? null : spec.id)}
              className="flex items-center gap-3.5 w-full px-5 py-4 text-left transition-colors hover:bg-gray-50/60"
            >
              <ChevronRight
                className={
                  "h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200 " +
                  (isOpen ? "rotate-90" : "")
                }
              />
              <div className="flex-1 min-w-0">
                <div className="text-[0.9375rem] font-bold text-gray-800 mb-1">
                  {localize(spec.title, locale)}
                </div>
                <span className="text-xs font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">
                  {spec.code}
                </span>
              </div>
            </button>

            <div className="accordion-content" data-open={isOpen}>
              <div className="accordion-inner">
                <div className="px-5 pb-5">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
                    {t("professionDetail.colleges.subheading")}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {spec.colleges.map((c, i) => (
                      <div
                        key={c.name}
                        className="bg-white border border-black/[0.04] rounded-xl p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.03),0_2px_8px_-2px_rgb(0_0_0/0.04)] hover-lift animate-stagger-fade-up"
                        style={{ "--stagger-index": i } as React.CSSProperties}
                      >
                        <div className="text-sm font-semibold text-gray-800 mb-1 flex items-center">
                          {c.name}
                          <InstitutionInfoButton name={c.name} />
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          <span className="text-xs text-gray-500">
                            <strong className="text-gray-600">{t("professionDetail.colleges.city")}</strong>{" "}
                            {c.city}
                          </span>
                          <span className="text-xs text-gray-500">
                            <strong className="text-gray-600">{t("professionDetail.colleges.duration")}</strong>{" "}
                            {localize(c.duration, locale)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
