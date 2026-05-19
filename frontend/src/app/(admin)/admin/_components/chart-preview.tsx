"use client";

import { BarChart3, PieChart, BarChart, Table } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import type { VisualizationType } from "../_components/mock-data";

const chartIcons: Record<VisualizationType, typeof BarChart3> = {
  bar: BarChart3,
  pie: PieChart,
  histogram: BarChart,
  table: Table,
};

const chartLabelKeys: Record<VisualizationType, string> = {
  bar: "cm.chartType.bar",
  pie: "cm.chartType.pie",
  histogram: "cm.chartType.histogram",
  table: "cm.chartType.table",
};

interface Props {
  type: VisualizationType;
}

export function ChartPreview({ type }: Props) {
  const { t } = useLocale();
  const Icon = chartIcons[type];

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-gray-50 border border-gray-100 py-6">
      <Icon className="w-8 h-8 text-gray-300" />
      <span className="text-[0.75rem] font-medium text-gray-400">
        {t(chartLabelKeys[type])} {t("cm.chartPreview.suffix")}
      </span>
    </div>
  );
}
