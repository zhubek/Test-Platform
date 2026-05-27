"use client";

import { useState } from "react";
import { ProfessionsTab } from "./_components/professions-tab";
import { UniverProgramsTab } from "./_components/univer-programs-tab";
import { CollegeProgramsTab } from "./_components/college-programs-tab";
import { UniversitiesTab } from "./_components/universities-tab";
import { CollegesTab } from "./_components/colleges-tab";
import { CharacteristicsTab } from "./_components/characteristics-tab";
import { CitiesTab } from "./_components/cities-tab";
import { useLocale } from "@/lib/locale-context";

const TABS = [
  "professions",
  "univerPrograms",
  "collegePrograms",
  "universities",
  "colleges",
  "cities",
  "characteristics",
] as const;
type Tab = (typeof TABS)[number];

export default function MethodicPage() {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>("professions");

  const tabLabels: Record<Tab, string> = {
    professions: t("cm.methodic.tabs.professions"),
    univerPrograms: t("cm.methodic.tabs.univerPrograms"),
    collegePrograms: t("cm.methodic.tabs.collegePrograms"),
    universities: t("cm.methodic.tabs.universities"),
    colleges: t("cm.methodic.tabs.colleges"),
    cities: t("cm.methodic.tabs.cities"),
    characteristics: t("cm.methodic.tabs.characteristics"),
  };

  return (
    <>
      <div className="animate-fade-in mb-6">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          {t("cm.methodic.heading")}
        </h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-100 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={
              "relative px-4 py-2.5 text-[0.82rem] font-medium transition-colors whitespace-nowrap " +
              (activeTab === tab
                ? "text-gray-900"
                : "text-gray-400 hover:text-gray-600")
            }
          >
            {tabLabels[tab]}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gray-900" />
            )}
          </button>
        ))}
      </div>

      {activeTab === "professions" && <ProfessionsTab />}
      {activeTab === "univerPrograms" && <UniverProgramsTab />}
      {activeTab === "collegePrograms" && <CollegeProgramsTab />}
      {activeTab === "universities" && <UniversitiesTab />}
      {activeTab === "colleges" && <CollegesTab />}
      {activeTab === "cities" && <CitiesTab />}
      {activeTab === "characteristics" && <CharacteristicsTab />}
    </>
  );
}
