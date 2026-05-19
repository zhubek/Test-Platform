"use client";

import { Save } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { LocalizedInput } from "@/components/localized-input";
import { StatusToggle } from "../../../_components/status-toggle";
import type { Localized } from "@/lib/localized";

interface Props {
  name: Localized;
  status: "draft" | "published";
  onNameChange: (v: Localized) => void;
  onStatusChange: (v: "draft" | "published") => void;
}

export function DashboardHeader({
  name,
  status,
  onNameChange,
  onStatusChange,
}: Props) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
      <LocalizedInput
        value={name}
        onChange={onNameChange}
        placeholder={t("cm.general.namePlaceholder")}
        className="flex-1 text-lg font-bold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-teal-500 outline-none pb-1 transition-colors placeholder:text-gray-400"
      />
      <div className="flex items-center gap-3">
        <StatusToggle status={status} onChange={onStatusChange} />
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[0.82rem] font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors">
          <Save className="w-3.5 h-3.5" />
          {t("cm.dashboardEditor.save")}
        </button>
      </div>
    </div>
  );
}
