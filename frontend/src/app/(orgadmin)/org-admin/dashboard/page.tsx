"use client";

import { orgLicenses } from "../licenses/_components/mock-data";
import { OrgDashboard } from "@/components/org-dashboard/org-dashboard";

export default function OrgDashboardPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          An overview of your organization&apos;s licenses and test activity.
        </p>
      </div>

      <OrgDashboard licenses={orgLicenses} />
    </>
  );
}
