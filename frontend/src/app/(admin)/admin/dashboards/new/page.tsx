"use client";

import { Breadcrumb } from "../../_components/breadcrumb";
import { DashboardEditorShell } from "../[id]/_components/dashboard-editor-shell";
import { useLocale } from "@/lib/locale-context";
import type { ContentDashboard } from "../../_components/mock-data";

const emptyDashboard: ContentDashboard = {
  id: "new",
  name: { en: "", ru: "", kz: "" },
  description: { en: "", ru: "", kz: "" },
  status: "draft",
  createdAt: new Date().toISOString().split("T")[0],
  updatedAt: new Date().toISOString().split("T")[0],
  widgets: [],
};

export default function NewDashboardPage() {
  const { t } = useLocale();

  return (
    <>
      <Breadcrumb
        items={[
          { label: t("cm.dashboards.heading"), href: "/admin/dashboards" },
          { label: t("cm.dashboards.breadcrumb.new") },
        ]}
      />
      <DashboardEditorShell initialData={emptyDashboard} />
    </>
  );
}
