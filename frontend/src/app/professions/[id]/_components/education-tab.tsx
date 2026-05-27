"use client";

import type { EducationData } from "../../_components/mock-data";
import { UniversityList } from "./university-list";
import { CollegeList } from "./college-list";
import { useLocale } from "@/lib/locale-context";

type SubTab = "universities" | "colleges";

const SUB_TAB_KEYS: SubTab[] = ["universities", "colleges"];

const SUB_TAB_I18N: Record<SubTab, string> = {
  universities: "professionDetail.education.universities",
  colleges: "professionDetail.education.colleges",
};

interface Props {
  data: EducationData;
  activeSub: SubTab;
  onSubChange: (sub: SubTab) => void;
}

export function EducationTab({ data, activeSub, onSubChange }: Props) {
  const { t } = useLocale();

  return (
    <div className="animate-fade-in">
      {/* Sub-tab bar */}
      <div className="flex gap-1 bg-gray-100/80 rounded-lg p-1 mb-6">
        {SUB_TAB_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => onSubChange(key)}
            className={
              "px-4 py-1.5 text-[0.8125rem] font-semibold rounded-md transition-all duration-200 " +
              (activeSub === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700")
            }
          >
            {t(SUB_TAB_I18N[key])}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeSub === "universities" && (
        <UniversityList specializations={data.specializations} />
      )}
      {activeSub === "colleges" && (
        <CollegeList collegeSpecs={data.collegeSpecs} />
      )}
    </div>
  );
}

export type { SubTab };
