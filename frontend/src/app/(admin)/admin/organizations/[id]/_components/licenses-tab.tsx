"use client";

// Org licenses management: the license table + bulk generation. Generation is
// bounded by the org's license allotment (licenseCount), enforced server-side;
// the UI mirrors the remaining count so authors see the budget up front.

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Plus, RefreshCw } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { defaultOrgApi, type OrgApi, type OrgDetail, type OrgLicense } from "@/lib/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Pull the human message out of an apiFetch error ("POST /x → 422: {json}").
export function apiMessage(e: unknown): string {
  const m = String(e instanceof Error ? e.message : e).match(/"message":"([^"]+)"/);
  return m ? m[1] : String(e instanceof Error ? e.message : e);
}

const STATE_BADGE: Record<OrgLicense["state"], { labelKey: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ISSUED: { labelKey: "admin.lic.stateIssued", variant: "secondary" },
  ACTIVE: { labelKey: "admin.lic.stateActive", variant: "default" },
  EXPIRED: { labelKey: "admin.lic.stateExpired", variant: "outline" },
  REVOKED: { labelKey: "admin.lic.stateRevoked", variant: "destructive" },
};

const fmtDate = (v: string | null) => (v ? new Date(v).toLocaleDateString() : "—");

export function LicensesTab({
  org,
  onOrgChanged,
  api = defaultOrgApi,
  canManage = true,
}: {
  org: OrgDetail;
  onOrgChanged: () => void;
  api?: OrgApi;
  canManage?: boolean;
}) {
  const { t } = useLocale();
  const [licenses, setLicenses] = useState<OrgLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [genOpen, setGenOpen] = useState(false);
  // Per-license freshly reset codes (shown until reload — they are one-time).
  const [freshCodes, setFreshCodes] = useState<Record<string, string>>({});

  const remaining = Math.max(0, org.licenseCount - org.licenseUsed);

  const reload = useCallback(() => {
    setLoading(true);
    api
      .fetchOrgLicenses(org.id)
      .then(setLicenses)
      .catch((e) => setError(apiMessage(e)))
      .finally(() => setLoading(false));
  }, [org.id, api]);

  useEffect(reload, [reload]);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      reload();
      onOrgChanged();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{org.licenseUsed}</span> {t("admin.lic.ofUsed")}{" "}
          <span className="font-semibold text-foreground">{org.licenseCount}</span> {t("admin.lic.licensesUsed")} ·{" "}
          <span className={remaining === 0 ? "font-semibold text-red-500" : "font-semibold text-teal-600"}>
            {remaining} {t("admin.lic.remaining")}
          </span>
        </p>
        {canManage && (
          <Button onClick={() => setGenOpen(true)} disabled={remaining === 0} title={remaining === 0 ? t("admin.lic.limitReached") : undefined}>
            <Plus className="mr-1 h-4 w-4" /> {t("admin.lic.generateLicenses")}
          </Button>
        )}
      </div>

      {error && <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("admin.lic.loadingLicenses")}</p>
      ) : licenses.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          {t("admin.lic.noLicenses")} {remaining > 0 ? t("admin.lic.generateFirstBatch") : t("admin.lic.setLimitFirst")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2">{t("admin.lic.colLicenseCode")}</th>
                <th className="px-3 py-2">{t("admin.lic.colHolder")}</th>
                <th className="px-3 py-2">{t("admin.common.status")}</th>
                <th className="px-3 py-2">{t("admin.lic.colIssued")}</th>
                <th className="px-3 py-2">{t("admin.lic.colExpires")}</th>
                <th className="px-3 py-2 text-right">{t("admin.common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((li) => {
                const badge = STATE_BADGE[li.state];
                return (
                  <tr key={li.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <CopyCode code={freshCodes[li.id] ?? li.licenseCode} highlight={!!freshCodes[li.id]} />
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs">{li.holder?.login ?? "—"}</span>
                      {li.holder?.name && <span className="ml-1.5 text-xs text-muted-foreground">{li.holder.name}</span>}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={badge.variant}>{t(badge.labelKey)}</Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{fmtDate(li.issuedDate)}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{fmtDate(li.expirationDate)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        {(li.state === "ISSUED" || li.state === "ACTIVE") && (
                          <Button variant="ghost" size="sm" disabled={busy} className="h-7 text-xs" onClick={() => act(() => api.licenseAction(li.id, "revoke"))}>
                            {t("admin.lic.revoke")}
                          </Button>
                        )}
                        {li.state === "EXPIRED" && (
                          <Button variant="ghost" size="sm" disabled={busy} className="h-7 text-xs" onClick={() => act(() => api.licenseAction(li.id, "renew"))}>
                            {t("admin.lic.renew")}
                          </Button>
                        )}
                        {li.state !== "REVOKED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            className="h-7 text-xs"
                            title={t("admin.lic.resetCodeHint")}
                            onClick={() =>
                              act(async () => {
                                const { code } = await api.resetLicenseCode(li.id);
                                setFreshCodes((c) => ({ ...c, [li.id]: code }));
                              })
                            }
                          >
                            <RefreshCw className="mr-1 h-3 w-3" /> {t("admin.lic.resetCode")}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          className="h-7 text-xs text-muted-foreground hover:text-red-500"
                          onClick={() => {
                            if (confirm(t("admin.lic.confirmDelete"))) {
                              act(() => api.deleteLicense(li.id));
                            }
                          }}
                        >
                          {t("admin.common.delete")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <GenerateDialog
        open={genOpen}
        onOpenChange={setGenOpen}
        orgId={org.id}
        remaining={remaining}
        api={api}
        defaultExpiration={(org.expirationDate ?? "").slice(0, 10)}
        maxExpiration={((org.expirationDate ?? org.projectExpirationDate) ?? "").slice(0, 10)}
        onDone={() => {
          reload();
          onOrgChanged();
        }}
      />
    </div>
  );
}

function GenerateDialog({
  open,
  onOpenChange,
  orgId,
  remaining,
  api,
  defaultExpiration,
  maxExpiration,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  orgId: string;
  remaining: number;
  api: OrgApi;
  defaultExpiration: string;
  maxExpiration: string;
  onDone: () => void;
}) {
  const { t } = useLocale();
  const [count, setCount] = useState(1);
  // Defaults to the org's expiration; editable but capped at it.
  const [expiration, setExpiration] = useState(defaultExpiration);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);

  // Re-seed the default whenever the dialog opens (org may have changed).
  useEffect(() => {
    if (open) setExpiration(defaultExpiration);
  }, [open, defaultExpiration]);

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setCodes(null);
      setError(null);
      setCount(1);
      setExpiration(defaultExpiration);
    }
  };

  const generate = async () => {
    if (!expiration) {
      setError(t("admin.lic.expirationRequired"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.generateLicenses(orgId, {
        count,
        expirationDate: new Date(expiration).toISOString(),
      });
      setCodes(res.codes);
      onDone();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        {codes ? (
          <>
            <DialogHeader>
              <DialogTitle>{codes.length} {t("admin.lic.licensesGenerated")}</DialogTitle>
              <DialogDescription>
                {t("admin.lic.handCodesHint")}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-56 space-y-1 overflow-auto rounded-md border bg-muted/30 p-2">
              {codes.map((c) => (
                <CopyCode key={c} code={c} />
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(codes.join("\n"))}>
                <Copy className="mr-1 h-3.5 w-3.5" /> {t("admin.lic.copyAll")}
              </Button>
              <Button onClick={() => close(false)}>{t("admin.lic.done")}</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("admin.lic.generateLicenses")}</DialogTitle>
              <DialogDescription>
                {t("admin.lic.generateHint")} {remaining} {remaining === 1 ? t("admin.lic.slotRemaining") : t("admin.lic.slotsRemaining")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("admin.lic.howMany")}
                </span>
                <Input
                  type="number"
                  min={1}
                  max={remaining}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(remaining, Number(e.target.value) || 1)))}
                  className="w-28"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("admin.lic.expirationDate")}
                </span>
                <Input
                  type="date"
                  value={expiration}
                  max={maxExpiration || undefined}
                  onChange={(e) => setExpiration(e.target.value)}
                  className="w-44"
                />
                <span className="mt-1 block text-[0.66rem] text-muted-foreground">
                  {t("admin.lic.expirationDefaultHint")}{maxExpiration ? `; ${t("admin.lic.noLaterThan")} ${maxExpiration}` : ""}.
                </span>
              </label>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => close(false)}>
                {t("admin.common.cancel")}
              </Button>
              <Button onClick={generate} disabled={busy || count < 1 || !expiration}>
                {busy ? t("admin.lic.generating") : `${t("admin.lic.generate")} ${count}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** A monospaced code with a copy button. */
export function CopyCode({ code, highlight }: { code: string; highlight?: boolean }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className={
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-xs transition-colors hover:border-teal-300 " +
        (highlight ? "border-teal-400 bg-teal-50 text-teal-800" : "bg-card")
      }
      title={t("admin.lic.copy")}
    >
      {code}
      {copied ? <Check className="h-3 w-3 text-teal-600" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
    </button>
  );
}
