"use client";

import { Plus } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { WidgetBlock } from "./widget-block";
import type { DashboardWidget, VisualizationType } from "../../../_components/mock-data";

interface Props {
  widgets: DashboardWidget[];
  onUpdate: (index: number, partial: Partial<DashboardWidget>) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
}

export function WidgetList({ widgets, onUpdate, onDelete, onAdd }: Props) {
  const { t } = useLocale();

  return (
    <div className="space-y-4">
      {widgets.map((w, i) => (
        <WidgetBlock
          key={w.id}
          title={w.title}
          type={w.type}
          sql={w.sql}
          onTitleChange={(v) => onUpdate(i, { title: v })}
          onTypeChange={(v: VisualizationType) => onUpdate(i, { type: v })}
          onSqlChange={(v) => onUpdate(i, { sql: v })}
          onDelete={() => onDelete(i)}
        />
      ))}

      <button
        onClick={onAdd}
        className="flex items-center gap-2 w-full justify-center rounded-xl border-2 border-dashed border-gray-200 py-4 text-[0.82rem] font-medium text-gray-400 hover:border-teal-300 hover:text-teal-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {t("cm.widget.addWidget")}
      </button>
    </div>
  );
}
