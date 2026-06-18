"use client";

// Organization detail: Dashboard (activity) | Licenses (table + generation) |
// Settings (general, license limit, admin, activation code, deletion).

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { fetchOrganization, type OrgDetail } from "@/lib/backend";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { OrgDashboard } from "@/components/org-dashboard/org-dashboard";
import { getOrgLicenses } from "@/app/(orgadmin)/org-admin/licenses/_components/mock-data";
import { LicensesTab } from "./_components/licenses-tab";
import { SettingsTab } from "./_components/settings-tab";
import { ResultsTab } from "./_components/results-tab";

type TabKey = "dashboard" | "licenses" | "results" | "settings";
const TABS: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "licenses", label: "Licenses" },
  { key: "results", label: "Results" },
  { key: "settings", label: "Settings" },
];

export default function AdminOrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("dashboard");

  const reload = useCallback(() => {
    fetchOrganization(id)
      .then(setOrg)
      .catch((e) => setError(String(e instanceof Error ? e.message : e)));
  }, [id]);

  useEffect(reload, [reload]);

  return (
    <>
      <Link
        href="/admin/organizations"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Organizations
      </Link>

      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{org?.name ?? "Organization"}</h1>
            {org && (
              <Badge variant="secondary">
                {org.licenseUsed}/{org.licenseCount} licenses
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {org?.description ? `${org.description} · ` : ""}Licenses, settings, and test activity.
          </p>
        </div>
      </div>

      {error && <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="mb-5 flex items-center gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === t.key ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {tab === t.key && <span className="absolute right-2 bottom-0 left-2 h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <OrgDashboard licenses={getOrgLicenses(id)} />}
      {tab === "licenses" && org && <LicensesTab org={org} onOrgChanged={reload} />}
      {tab === "results" && org && <ResultsTab org={org} />}
      {tab === "settings" && org && (
        <SettingsTab key={`${org.id}-${org.code}`} org={org} onOrgChanged={reload} />
      )}
    </>
  );
}
