"use client";

import { useLocale } from "@/lib/locale-context";

export type TabId = "general" | "questions" | "calculation" | "result" | "dashboard";

const tabKeys: Record<TabId, string> = {
  general: "cm.testEditor.tabs.general",
  questions: "cm.testEditor.tabs.questions",
  calculation: "cm.testEditor.tabs.calculation",
  result: "cm.testEditor.tabs.resultView",
  dashboard: "cm.testEditor.tabs.dashboard",
};

const tabIds: TabId[] = ["general", "questions", "calculation", "result", "dashboard"];

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabBar({ active, onChange }: Props) {
  const { t } = useLocale();

  return (
    <div className="mb-6 flex items-center gap-1 overflow-x-auto border-b">
      {tabIds.map((id) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={
            "relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors " +
            (active === id
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {t(tabKeys[id])}
          {active === id && (
            <span className="absolute right-2 bottom-0 left-2 h-0.5 rounded-full bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
}
