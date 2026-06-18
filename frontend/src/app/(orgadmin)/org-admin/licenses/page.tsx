"use client";

// Org-admin org view — the same Dashboard / Licenses / Settings tabs as the
// super-admin org page (/admin/organizations/[id]), but scoped to the caller's
// own organization and run with the org-admin session. Settings is shown only
// when the backend says this caller may update the org (i.e. a super/project
// admin) — an org admin sees Dashboard + Licenses only. Sign-in is login +
// activation code (no password).

import { useCallback, useEffect, useState } from "react";
import { Building2, LogOut } from "lucide-react";
import { fetchMyOrg, getOrgToken, orgApi, orgLogin, setOrgToken, type MyOrg } from "@/lib/orgadmin-api";
import type { OrgDetail } from "@/lib/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { OrgDashboard } from "@/components/org-dashboard/org-dashboard";
import { getOrgLicenses } from "@/app/(orgadmin)/org-admin/licenses/_components/mock-data";
import { LicensesTab } from "@/app/(admin)/admin/organizations/[id]/_components/licenses-tab";
import { SettingsTab } from "@/app/(admin)/admin/organizations/[id]/_components/settings-tab";
import { ResultsTab } from "@/app/(admin)/admin/organizations/[id]/_components/results-tab";

type TabKey = "dashboard" | "licenses" | "results" | "settings";

export default function OrgAdminLicensesPage() {
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [caps, setCaps] = useState<MyOrg["capabilities"]>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("licenses");

  // Silent re-fetch (after a license action) — must NOT flip the full-page
  // loading gate, or it would unmount an open dialog mid-flow.
  const refresh = useCallback(async () => {
    try {
      const res = await fetchMyOrg();
      setOrg(res.data);
      setCaps(res.capabilities);
    } catch {
      /* keep current view */
    }
  }, []);

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
      setCaps(res.capabilities);
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
  if (!org) return <LoginCard onDone={load} />;

  const canSettings = caps.update === true;
  const canManage = caps.createLicense === true;
  const TABS: { key: TabKey; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "licenses", label: "Licenses" },
    { key: "results", label: "Results" },
    ...(canSettings ? [{ key: "settings" as const, label: "Settings" }] : []),
  ];
  const active = TABS.some((t) => t.key === tab) ? tab : "licenses";

  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
            <Badge variant="secondary">
              {org.licenseUsed}/{org.licenseCount} licenses
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {org.description ? `${org.description} · ` : ""}Licenses and activity for your organization.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setOrgToken(null); setOrg(null); }}>
          <LogOut className="mr-1 h-4 w-4" /> Sign out
        </Button>
      </div>

      <div className="mb-5 flex items-center gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors",
              active === t.key ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {active === t.key && <span className="absolute right-2 bottom-0 left-2 h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      {active === "dashboard" && <OrgDashboard licenses={getOrgLicenses(org.id)} />}
      {active === "licenses" && <LicensesTab org={org} onOrgChanged={refresh} api={orgApi} canManage={canManage} />}
      {active === "results" && <ResultsTab org={org} api={orgApi} />}
      {active === "settings" && canSettings && <SettingsTab org={org} onOrgChanged={refresh} api={orgApi} />}
    </>
  );
}

function LoginCard({ onDone }: { onDone: () => void }) {
  const [login, setLogin] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await orgLogin(login.trim(), code.trim());
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight">Organization sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in with your login and activation code.</p>
        <div className="mt-4 space-y-2">
          <Input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Login" className="font-mono" />
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Activation code"
            className="font-mono"
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={submit} disabled={busy || !login.trim() || !code.trim()} className="w-full">
            {busy ? "…" : "Sign in"}
          </Button>
        </div>
      </div>
    </div>
  );
}
