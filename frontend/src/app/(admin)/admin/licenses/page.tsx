"use client";

import { useProject } from "@/lib/project-context";
import { LicensesTable } from "@/app/(orgadmin)/org-admin/licenses/_components/licenses-table";

export default function AdminLicensesPage() {
  const { project } = useProject();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Licenses</h1>
        <p className="text-sm text-muted-foreground">
          Licenses across <span className="font-medium text-foreground">{project.name}</span>.
        </p>
      </div>
      <LicensesTable />
    </>
  );
}
