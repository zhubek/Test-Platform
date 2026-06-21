"use client";

// Organization settings: general fields + license limit, the org admin
// (login/name, activation-code reset = password restore), and deletion.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Trash2 } from "lucide-react";
import { defaultOrgApi, type OrgAdmin, type OrgApi, type OrgDetail } from "@/lib/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiMessage, CopyCode } from "./licenses-tab";

export function SettingsTab({
  org,
  onOrgChanged,
  api = defaultOrgApi,
}: {
  org: OrgDetail;
  onOrgChanged: () => void;
  api?: OrgApi;
}) {
  const router = useRouter();

  // General
  const [name, setName] = useState(org.name);
  const [description, setDescription] = useState(org.description ?? "");
  const [limit, setLimit] = useState(org.licenseCount);
  const [expiration, setExpiration] = useState(org.expirationDate?.slice(0, 10) ?? "");
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [generalMsg, setGeneralMsg] = useState<string | null>(null);

  // Admin
  const [admin, setAdmin] = useState<OrgAdmin | null>(null);
  const [adminLogin, setAdminLogin] = useState("");
  const [adminName, setAdminName] = useState("");
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  // Activation code
  const [code, setCode] = useState(org.code);
  const [codeFresh, setCodeFresh] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    api.fetchOrgAdmin(org.id)
      .then((a) => {
        setAdmin(a);
        setAdminLogin(a?.login ?? "");
        setAdminName(a?.name ?? "");
      })
      .catch((e) => setAdminMsg(apiMessage(e)));
  }, [org.id]);

  const saveGeneral = async () => {
    setSavingGeneral(true);
    setGeneralMsg(null);
    try {
      await api.updateOrganization(org.id, {
        name: name.trim() || org.name,
        description,
        licenseCount: Math.max(0, limit),
        expirationDate: expiration || null,
      });
      onOrgChanged();
      setGeneralMsg("Saved");
    } catch (e) {
      setGeneralMsg(apiMessage(e));
    } finally {
      setSavingGeneral(false);
    }
  };

  const saveAdmin = async () => {
    setSavingAdmin(true);
    setAdminMsg(null);
    try {
      const a = await api.setOrgAdmin(org.id, { login: adminLogin.trim(), name: adminName.trim() || undefined });
      setAdmin(a);
      setAdminMsg("Saved");
    } catch (e) {
      setAdminMsg(apiMessage(e));
    } finally {
      setSavingAdmin(false);
    }
  };

  const resetCode = async () => {
    if (!confirm("Generate a new activation code? The old code stops working immediately — give the new one to the org admin to sign in with.")) return;
    setResetting(true);
    try {
      const { code: next } = await api.resetOrgCode(org.id);
      setCode(next);
      setCodeFresh(true);
      setAdmin((a) => (a ? { ...a, status: "PENDING" } : a));
    } catch (e) {
      alert(apiMessage(e));
    } finally {
      setResetting(false);
    }
  };

  const removeOrg = async () => {
    if (!confirm(`Delete “${org.name}” with all its licenses and members? This cannot be undone.`)) return;
    try {
      await api.deleteOrganization(org.id);
      router.push("/admin/organizations");
    } catch (e) {
      alert(apiMessage(e));
    }
  };

  return (
    <div className="grid max-w-4xl gap-5 lg:grid-cols-2">
      {/* General + limits */}
      <section className="rounded-xl border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold">General</h3>
        <div className="space-y-3">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Description / city">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="License limit">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={limit}
                onChange={(e) => setLimit(Math.max(0, Number(e.target.value) || 0))}
                className="w-28"
              />
              <span className="text-xs text-muted-foreground">{org.licenseUsed} already issued</span>
            </div>
          </Field>
          {limit < org.licenseUsed && (
            <p className="text-xs text-amber-600">
              Limit below the {org.licenseUsed} already issued — no new licenses can be generated until it&apos;s raised.
            </p>
          )}
          <Field label="Expiration date">
            <Input
              type="date"
              value={expiration}
              max={org.projectExpirationDate?.slice(0, 10) || undefined}
              onChange={(e) => setExpiration(e.target.value)}
              className="w-44"
            />
          </Field>
          {org.projectExpirationDate && (
            <p className="text-xs text-muted-foreground">
              Can&apos;t be later than the project&apos;s expiration ({org.projectExpirationDate.slice(0, 10)}). New licenses
              default to this date.
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button onClick={saveGeneral} disabled={savingGeneral}>
              {savingGeneral ? "Saving…" : "Save"}
            </Button>
            {generalMsg && (
              <span className={generalMsg === "Saved" ? "text-xs text-teal-600" : "text-xs text-red-500"}>{generalMsg}</span>
            )}
          </div>
        </div>
      </section>

      {/* Admin + activation */}
      <section className="rounded-xl border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold">Organization admin</h3>
        <div className="space-y-3">
          <Field label="Login">
            <Input value={adminLogin} onChange={(e) => setAdminLogin(e.target.value)} className="font-mono" />
          </Field>
          <Field label="Name">
            <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} />
          </Field>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Status:{" "}
            {admin ? (
              <Badge variant={admin.status === "ACTIVE" ? "default" : "secondary"}>{admin.status}</Badge>
            ) : (
              <span>no admin yet — set a login and save</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={saveAdmin} disabled={savingAdmin || !adminLogin.trim()}>
              {savingAdmin ? "Saving…" : "Save admin"}
            </Button>
            {adminMsg && (
              <span className={adminMsg === "Saved" ? "text-xs text-teal-600" : "text-xs text-red-500"}>{adminMsg}</span>
            )}
          </div>

          <div className="mt-2 rounded-lg border bg-muted/30 p-3">
            <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Activation code
            </p>
            <div className="flex items-center justify-between gap-2">
              <CopyCode code={code} highlight={codeFresh} />
              <Button variant="outline" size="sm" onClick={resetCode} disabled={resetting}>
                <RefreshCw className="mr-1 h-3.5 w-3.5" /> {resetting ? "Resetting…" : "Reset code"}
              </Button>
            </div>
            <p className="mt-1.5 text-[0.66rem] leading-relaxed text-muted-foreground">
              The org admin signs in at <code className="font-mono">/org-admin</code> with their login + this code (no
              password). Reset rotates it — the old code stops working immediately.
            </p>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-red-200 bg-red-50/40 p-5 lg:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-red-700">Delete organization</h3>
            <p className="text-xs text-red-600/80">Removes the organization, its licenses, and its members.</p>
          </div>
          <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-100" onClick={removeOrg}>
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
