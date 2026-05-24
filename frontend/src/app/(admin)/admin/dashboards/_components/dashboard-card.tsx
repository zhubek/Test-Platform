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
      className="block bg-card rounded-xl border shadow-sm p-5 hover:border-primary/30 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-[0.92rem] font-semibold text-foreground group-hover:text-primary transition-colors">
              {localize(dashboard.name, locale)}
            </h3>
            <p className="text-[0.72rem] text-muted-foreground mt-0.5">
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

      <p className="text-[0.78rem] text-muted-foreground line-clamp-2 mb-3">
        {localize(dashboard.description, locale)}
      </p>

      <div className="flex items-center gap-3 text-[0.72rem] text-muted-foreground">
        <span>{dashboard.widgets.length} widget{dashboard.widgets.length !== 1 ? "s" : ""}</span>
        <span className="w-1 h-1 rounded-full bg-muted" />
        <span>{t("common.created")} {dashboard.createdAt}</span>
      </div>
    </a>
  );
}
