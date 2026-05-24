"use client";

import { Save } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
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
        className="flex-1 text-lg font-bold"
      />
      <div className="flex items-center gap-3">
        <StatusToggle status={status} onChange={onStatusChange} />
        <Button>
          <Save className="w-3.5 h-3.5" />
          {t("cm.dashboardEditor.save")}
        </Button>
      </div>
    </div>
  );
}
