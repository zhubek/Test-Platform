"use client";

import { useProject } from "@/lib/project-context";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { AdminLicensesTable } from "./_components/admin-licenses-table";

export default function AdminLicensesPage() {
  const { project } = useProject();
  const { t, locale } = useLocale();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.licpage.heading")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.licpage.acrossPrefix")} <span className="font-medium text-foreground">{localize(project.name, locale)}</span>.
        </p>
      </div>
      <AdminLicensesTable projectId={project.id} />
    </>
  );
}
