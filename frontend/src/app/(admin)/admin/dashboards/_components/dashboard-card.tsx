"use client";

import { LayoutDashboard } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import type { ContentDashboard } from "../../_components/mock-data";

interface Props {
  dashboard: ContentDashboard;
}

export function DashboardCard({ dashboard }: Props) {
  const { t, locale } = useLocale();

  return (
    <a
      href={`/admin/dashboards/${dashboard.id}`}
      className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-teal-200 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <h3 className="text-[0.92rem] font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
              {localize(dashboard.name, locale)}
            </h3>
            <p className="text-[0.72rem] text-gray-400 mt-0.5">
              {t("common.updated")} {dashboard.updatedAt}
            </p>
          </div>
        </div>
        <span
          className={
            "text-[0.65rem] font-semibold px-2 py-0.5 rounded-full " +
            (dashboard.status === "published"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700")
          }
        >
          {dashboard.status === "published" ? t("cm.status.published") : t("cm.status.draft")}
        </span>
      </div>

      <p className="text-[0.78rem] text-gray-500 line-clamp-2 mb-3">
        {localize(dashboard.description, locale)}
      </p>

      <div className="flex items-center gap-3 text-[0.72rem] text-gray-400">
        <span>{dashboard.widgets.length} widget{dashboard.widgets.length !== 1 ? "s" : ""}</span>
        <span className="w-1 h-1 rounded-full bg-gray-200" />
        <span>{t("common.created")} {dashboard.createdAt}</span>
      </div>
    </a>
  );
}
