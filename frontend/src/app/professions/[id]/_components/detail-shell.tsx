"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/locale-context";
import type { ProfessionData, ProfessionDetail } from "../../_components/mock-data";
import { DetailHeader } from "./detail-header";
import { DescriptionTab } from "./description-tab";
import { CharacteristicsTab } from "./characteristics-tab";
import { EducationTab, type SubTab } from "./education-tab";
import { LaborMarketTab } from "./labor-market-tab";

type TabKey = "description" | "characteristics" | "education" | "labor";

const TAB_KEYS: TabKey[] = ["description", "characteristics", "education", "labor"];

const TAB_I18N_KEYS: Record<TabKey, string> = {
  description: "professionDetail.tabs.description",
  characteristics: "professionDetail.tabs.characteristics",
  education: "professionDetail.tabs.education",
  labor: "professionDetail.tabs.labor",
};

const VALID_TABS = new Set<string>(TAB_KEYS);

interface Props {
  profession: ProfessionData;
  detail: ProfessionDetail | null;
  mode: string;
}

export function DetailShell({ profession, detail, mode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();

  const tabParam = searchParams.get("tab");
  const activeTab: TabKey =
    tabParam && VALID_TABS.has(tabParam) ? (tabParam as TabKey) : "description";

  const subParam = (searchParams.get("sub") as SubTab) || "universities";

  const backHref = `/professions${mode ? `?mode=${mode}` : ""}`;

  const goToSkillCourses = useCallback(
    (skill: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "education");
      params.set("sub", "courses");
      params.set("skill", skill);
      router.push(`/professions/${profession.id}?${params.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams, profession.id],
  );

  const setTab = useCallback(
    (key: TabKey) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", key);
      params.delete("sub");
      router.push(`/professions/${profession.id}?${params.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams, profession.id],
  );

  const setSub = useCallback(
    (sub: SubTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("sub", sub);
      router.push(`/professions/${profession.id}?${params.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams, profession.id],
  );

  if (!detail) {
    return (
      <>
        <DetailHeader profession={profession} backHref={backHref} />
        <div className="animate-fade-in flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {t("professionDetail.noData.heading")}
          </h3>
          <p className="text-[0.88rem] text-gray-400 max-w-md leading-relaxed">
            {t("professionDetail.noData.body")}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <DetailHeader profession={profession} backHref={backHref} />

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100/80 rounded-xl p-1 mb-7 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={
              "shrink-0 px-3 sm:px-5 py-2 text-[0.8125rem] sm:text-sm font-medium rounded-lg transition-all duration-200 " +
              (activeTab === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700")
            }
          >
            {t(TAB_I18N_KEYS[key])}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div key={activeTab} className="animate-fade-in">
        {activeTab === "description" && (
          <DescriptionTab data={detail.description} onSkillClick={goToSkillCourses} />
        )}
        {activeTab === "characteristics" && (
          <CharacteristicsTab data={detail.characteristics} />
        )}
        {activeTab === "education" && (
          <EducationTab
            data={detail.education}
            activeSub={subParam}
            onSubChange={setSub}
          />
        )}
        {activeTab === "labor" && (
          <LaborMarketTab data={detail.laborMarket} />
        )}
      </div>
    </>
  );
}
