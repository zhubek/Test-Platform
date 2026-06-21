"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchMyOrg, getOrgToken, orgApi, setOrgToken } from "@/lib/orgadmin-api";
import type { OrgDetail } from "@/lib/backend";
import { OrgDashboard } from "@/components/org-dashboard/org-dashboard";

export default function OrgDashboardPage() {
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!getOrgToken()) {
      setOrg(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchMyOrg();
      setOrg(res.data);
    } catch {
      setOrgToken(null);
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="py-20 text-center text-sm text-muted-foreground">Loading…</p>;
  if (!org)
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        Please{" "}
        <Link href="/org-admin/licenses" className="underline">
          sign in
        </Link>{" "}
        to view your dashboard.
      </p>
    );

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          An overview of your organization&apos;s licenses and test activity.
        </p>
      </div>
      <OrgDashboard org={org} api={orgApi} />
    </>
  );
}
