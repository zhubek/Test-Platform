import { LicensesTable } from "./_components/licenses-table";

export default function OrgLicensesPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Licenses</h1>
        <p className="text-sm text-muted-foreground">
          Manage student licenses, accessible tests, and tags.
        </p>
      </div>
      <LicensesTable />
    </>
  );
}
