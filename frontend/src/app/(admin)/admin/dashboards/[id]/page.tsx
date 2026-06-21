"use client";

import { use } from "react";
import { Breadcrumb } from "../../_components/breadcrumb";
import { DashboardConstructor } from "./_components/dashboard-constructor";
import { contentDashboards } from "../../_components/mock-data";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";

export default function DashboardEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t, locale } = useLocale();
  const dashboard =
    contentDashboards.find((d) => d.id === id) ?? contentDashboards[0]!;

  return (
    <>
      <Breadcrumb
        items={[
          { label: t("cm.dashboards.heading"), href: "/admin/dashboards" },
          { label: localize(dashboard.name, locale) },
        ]}
      />
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">{localize(dashboard.name, locale)}</h1>
        <p className="text-sm text-muted-foreground">{localize(dashboard.description, locale)}</p>
      </div>
      <DashboardConstructor dashboardId={id} />
    </>
  );
}
