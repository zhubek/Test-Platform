"use client";

import { useLocale } from "@/lib/locale-context";

export type TabId = "general" | "questions" | "calculation" | "results" | "dashboard";

const tabKeys: Record<TabId, string> = {
  general: "cm.testEditor.tabs.general",
  questions: "cm.testEditor.tabs.questions",
  calculation: "cm.testEditor.tabs.calculation",
  results: "cm.testEditor.tabs.results",
  dashboard: "cm.testEditor.tabs.dashboard",
};

const tabIds: TabId[] = ["general", "questions", "calculation", "results", "dashboard"];

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabBar({ active, onChange }: Props) {
  const { t } = useLocale();

  return (
    <div className="flex items-center gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
      {tabIds.map((id) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={
            "relative shrink-0 px-4 py-2.5 text-[0.82rem] font-medium transition-colors " +
            (active === id
              ? "text-gray-900"
              : "text-gray-400 hover:text-gray-600")
          }
        >
          {t(tabKeys[id])}
          {active === id && (
            <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-teal-600" />
          )}
        </button>
      ))}
    </div>
  );
}
