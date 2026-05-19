"use client";

import { Plus } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { DashboardCard } from "./_components/dashboard-card";
import { contentDashboards } from "../_components/mock-data";

export default function DashboardsPage() {
  const { t } = useLocale();

  return (
    <>
      <div className="animate-fade-in flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          {t("cm.dashboards.heading")}
        </h1>
        <a
          href="/admin/dashboards/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[0.82rem] font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("cm.dashboards.create")}
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contentDashboards.map((dash, i) => (
          <div
            key={dash.id}
            className="animate-stagger-fade-up"
            style={{ "--stagger-index": i } as React.CSSProperties}
          >
            <DashboardCard dashboard={dash} />
          </div>
        ))}
      </div>
    </>
  );
}
