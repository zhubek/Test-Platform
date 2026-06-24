"use client";

// Organization settings: general fields + license limit, the org admin
// (login/name, activation-code reset = password restore), and deletion.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Trash2 } from "lucide-react";
import { defaultOrgApi, type OrgAdmin, type OrgApi, type OrgDetail } from "@/lib/backend";
import { useLocale } from "@/lib/locale-context";
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
  const { t } = useLocale();
  const savedMsg = t("admin.common.saved");

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
      setGeneralMsg(savedMsg);
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
      setAdminMsg(savedMsg);
    } catch (e) {
      setAdminMsg(apiMessage(e));
    } finally {
      setSavingAdmin(false);
    }
  };

  const resetCode = async () => {
    if (!confirm(t("admin.orgSettings.resetCodeConfirm"))) return;
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
    if (!confirm(`${t("admin.orgSettings.deleteConfirmPrefix")} “${org.name}” ${t("admin.orgSettings.deleteConfirmSuffix")}`)) return;
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
        <h3 className="mb-4 text-sm font-semibold">{t("admin.orgSettings.general")}</h3>
        <div className="space-y-3">
          <Field label={t("admin.common.name")}>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label={t("admin.orgSettings.descriptionCity")}>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label={t("admin.orgSettings.licenseLimit")}>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={limit}
                onChange={(e) => setLimit(Math.max(0, Number(e.target.value) || 0))}
                className="w-28"
              />
              <span className="text-xs text-muted-foreground">{org.licenseUsed} {t("admin.orgSettings.alreadyIssued")}</span>
            </div>
          </Field>
          {limit < org.licenseUsed && (
            <p className="text-xs text-amber-600">
              {t("admin.orgSettings.limitBelowPrefix")} {org.licenseUsed} {t("admin.orgSettings.limitBelowSuffix")}
            </p>
          )}
          <Field label={t("admin.orgSettings.expirationDate")}>
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
              {t("admin.orgSettings.projectExpirationPrefix")} ({org.projectExpirationDate.slice(0, 10)}). {t("admin.orgSettings.projectExpirationSuffix")}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button onClick={saveGeneral} disabled={savingGeneral}>
              {savingGeneral ? t("admin.common.saving") : t("admin.common.save")}
            </Button>
            {generalMsg && (
              <span className={generalMsg === savedMsg ? "text-xs text-teal-600" : "text-xs text-red-500"}>{generalMsg}</span>
            )}
          </div>
        </div>
      </section>

      {/* Admin + activation */}
      <section className="rounded-xl border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold">{t("admin.orgSettings.organizationAdmin")}</h3>
        <div className="space-y-3">
          <Field label={t("admin.common.login")}>
            <Input value={adminLogin} onChange={(e) => setAdminLogin(e.target.value)} className="font-mono" />
          </Field>
          <Field label={t("admin.common.name")}>
            <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} />
          </Field>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {t("admin.common.status")}:{" "}
            {admin ? (
              <Badge variant={admin.status === "ACTIVE" ? "default" : "secondary"}>{admin.status}</Badge>
            ) : (
              <span>{t("admin.orgSettings.noAdminYet")}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={saveAdmin} disabled={savingAdmin || !adminLogin.trim()}>
              {savingAdmin ? t("admin.common.saving") : t("admin.orgSettings.saveAdmin")}
            </Button>
            {adminMsg && (
              <span className={adminMsg === savedMsg ? "text-xs text-teal-600" : "text-xs text-red-500"}>{adminMsg}</span>
            )}
          </div>

          <div className="mt-2 rounded-lg border bg-muted/30 p-3">
            <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("admin.orgSettings.activationCode")}
            </p>
            <div className="flex items-center justify-between gap-2">
              <CopyCode code={code} highlight={codeFresh} />
              <Button variant="outline" size="sm" onClick={resetCode} disabled={resetting}>
                <RefreshCw className="mr-1 h-3.5 w-3.5" /> {resetting ? t("admin.orgSettings.resetting") : t("admin.orgSettings.resetCode")}
              </Button>
            </div>
            <p className="mt-1.5 text-[0.66rem] leading-relaxed text-muted-foreground">
              {t("admin.orgSettings.activationHintPrefix")} <code className="font-mono">/org-admin</code> {t("admin.orgSettings.activationHintSuffix")}
            </p>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-red-200 bg-red-50/40 p-5 lg:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-red-700">{t("admin.orgSettings.deleteOrganization")}</h3>
            <p className="text-xs text-red-600/80">{t("admin.orgSettings.deleteOrganizationHint")}</p>
          </div>
          <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-100" onClick={removeOrg}>
            <Trash2 className="mr-1 h-4 w-4" /> {t("admin.common.delete")}
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
