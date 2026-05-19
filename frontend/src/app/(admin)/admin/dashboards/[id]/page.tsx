"use client";

import { use } from "react";
import { Breadcrumb } from "../../_components/breadcrumb";
import { DashboardEditorShell } from "./_components/dashboard-editor-shell";
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
      <DashboardEditorShell initialData={dashboard} />
    </>
  );
}
