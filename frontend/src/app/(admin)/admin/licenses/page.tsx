"use client";

import { useProject } from "@/lib/project-context";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { LicensesTable } from "@/app/(orgadmin)/org-admin/licenses/_components/licenses-table";

export default function AdminLicensesPage() {
  const { project } = useProject();
  const { locale } = useLocale();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Licenses</h1>
        <p className="text-sm text-muted-foreground">
          Licenses across <span className="font-medium text-foreground">{localize(project.name, locale)}</span>.
        </p>
      </div>
      <LicensesTable />
    </>
  );
}
