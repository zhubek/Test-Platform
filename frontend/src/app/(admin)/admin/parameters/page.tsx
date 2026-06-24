"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X, Save, GripVertical, Star } from "lucide-react";
import {
  useProject,
  MAX_PARAMETERS,
  type ProjectParameter,
} from "@/lib/project-context";
import {
  fetchLanguages,
  assignProjectLanguage,
  unassignProjectLanguage,
  setProjectDefaultLanguage,
  updateProjectFields,
  fetchProjectAdmin,
  setProjectAdmin,
  exportProject,
  importProject,
  type BeLanguage,
  type ProjectAdmin,
  type ProjectBundle,
} from "@/lib/backend";
import { useAdminAuth } from "@/lib/admin-auth";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/locale-context";
import { localize, l, type Localized } from "@/lib/localized";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LocalizedInput } from "@/components/localized-input";
import { LocalizedTextarea } from "@/components/localized-textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

let pid = 0;
const newParamId = () => `np-${Date.now()}-${++pid}`;

export default function ParametersPage() {
  const { project, updateProject } = useProject();
  const { me } = useAdminAuth();
  const { locale } = useLocale();

  // Local editable copy, reset when the active project changes.
  const [name, setName] = useState<Localized>(project.name);
  const [description, setDescription] = useState<Localized>(project.description);
  const [licenseLimit, setLicenseLimit] = useState(project.licenseLimit);
  const [expiration, setExpiration] = useState(project.expirationDate?.slice(0, 10) ?? "");
  const [orgLimit, setOrgLimit] = useState(project.organizationLimit);
  const [params, setParams] = useState<ProjectParameter[]>(project.parameters);
  const [saved, setSaved] = useState(false);

  // Global language catalog (every language the platform knows about).
  const [catalog, setCatalog] = useState<BeLanguage[]>([]);
  useEffect(() => {
    fetchLanguages().then(setCatalog).catch((e) => console.error("Failed to load languages:", e));
  }, []);
  const codeToId = useMemo(() => new Map(catalog.map((x) => [x.name, x.id])), [catalog]);

  useEffect(() => {
    setName(project.name);
    setDescription(project.description);
    setLicenseLimit(project.licenseLimit);
    setExpiration(project.expirationDate?.slice(0, 10) ?? "");
    setOrgLimit(project.organizationLimit);
    setParams(project.parameters);
  }, [project]);

  // Language assignment persists immediately (separate from the Save button).
  const assigned = project.languages;
  const defaultCode = project.defaultLanguage;
  const available = catalog.filter((x) => !assigned.includes(x.name));

  const addLanguage = async (code: string) => {
    const id = codeToId.get(code);
    if (!id || assigned.includes(code)) return;
    try {
      await assignProjectLanguage(project.id, id);
      updateProject(project.id, { languages: [...assigned, code] });
    } catch (e) {
      console.error("Failed to add language:", e);
    }
  };

  const removeLanguage = async (code: string) => {
    const id = codeToId.get(code);
    if (!id || code === defaultCode || assigned.length <= 1) return;
    try {
      await unassignProjectLanguage(project.id, id);
      updateProject(project.id, { languages: assigned.filter((c) => c !== code) });
    } catch (e) {
      console.error("Failed to remove language:", e);
    }
  };

  const makeDefault = async (code: string) => {
    const id = codeToId.get(code);
    if (!id || code === defaultCode) return;
    try {
      await setProjectDefaultLanguage(project.id, id);
      updateProject(project.id, { defaultLanguage: code });
    } catch (e) {
      console.error("Failed to set default language:", e);
    }
  };

  const addParam = () => {
    if (params.length >= MAX_PARAMETERS) return;
    setParams((p) => [
      ...p,
      { id: newParamId(), label: l(""), type: "single", options: [l("")] },
    ]);
  };

  const updateParam = (id: string, patch: Partial<ProjectParameter>) =>
    setParams((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const removeParam = (id: string) =>
    setParams((p) => p.filter((x) => x.id !== id));

  const addOption = (id: string) =>
    setParams((p) =>
      p.map((x) => (x.id === id ? { ...x, options: [...x.options, l("")] } : x)),
    );

  const updateOption = (id: string, idx: number, value: Localized) =>
    setParams((p) =>
      p.map((x) =>
        x.id === id
          ? { ...x, options: x.options.map((o, i) => (i === idx ? value : o)) }
          : x,
      ),
    );

  const removeOption = (id: string, idx: number) =>
    setParams((p) =>
      p.map((x) =>
        x.id === id ? { ...x, options: x.options.filter((_, i) => i !== idx) } : x,
      ),
    );

  const save = () => {
    const expISO = expiration ? new Date(expiration).toISOString() : null;
    updateProject(project.id, {
      name,
      description,
      licenseLimit,
      expirationDate: expISO,
      organizationLimit: orgLimit,
      parameters: params
        .map((p) => ({
          ...p,
          options: p.options.filter((o) => (o.en || o.ru || o.kk).trim() !== ""),
        }))
        .filter((p) => (p.label.en || p.label.ru || p.label.kk).trim() !== ""),
    });
    // Persist the backend-backed project settings (license limit + expiration).
    if (project.id) {
      updateProjectFields(project.id, { licenseLimit, expirationDate: expISO }).catch((e) =>
        console.error("Failed to save project settings:", e),
      );
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project parameters</h1>
          <p className="text-sm text-muted-foreground">
            Settings for{" "}
            <span className="font-medium text-foreground">{localize(project.name, locale)}</span>.
          </p>
        </div>
        <Button onClick={save}>
          <Save className="mr-1 h-4 w-4" />
          {saved ? "Saved" : "Save"}
        </Button>
      </div>

      <div className="space-y-6">
        <div className={cn("grid items-start gap-6", me.isSuper && "lg:grid-cols-2")}>
          {/* Project details */}
          <section className="rounded-xl border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold">Project</h3>
            <div className="space-y-4">
            <LocalizedInput
              label="Project name"
              value={name}
              onChange={setName}
              className="max-w-md"
            />
            <LocalizedTextarea
              label="Description"
              value={description}
              onChange={setDescription}
              rows={2}
              className="max-w-md"
            />
            <div className="flex flex-wrap gap-5">
              <div>
                <label className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  License limit
                </label>
                <Input
                  type="number"
                  min={0}
                  value={licenseLimit}
                  onChange={(e) => setLicenseLimit(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-32"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Expiration date
                </label>
                <Input
                  type="date"
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value)}
                  className="w-44"
                />
                <p className="mt-1 text-[0.66rem] text-muted-foreground">
                  Org & license dates can&apos;t exceed this.
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Organization limit
                </label>
                <Input
                  type="number"
                  min={0}
                  value={orgLimit}
                  onChange={(e) => setOrgLimit(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-32"
                />
              </div>
            </div>
            </div>
          </section>

          {/* Project admin (super-admin only) — login + password to sign in to /admin */}
          {me.isSuper && project.id && <ProjectAdminCard projectId={project.id} />}
        </div>

        {/* Languages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Languages</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              The content languages this project uses. Editors show a translation chip per
              language here and hide all others. The starred one is the source/fallback.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {assigned.map((code) => {
                const lang = catalog.find((x) => x.name === code);
                const isDefault = code === defaultCode;
                return (
                  <div
                    key={code}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm",
                      isDefault ? "border-teal-300 bg-teal-50" : "border-gray-200",
                    )}
                  >
                    <span className="font-semibold uppercase text-gray-700">{code}</span>
                    {lang?.label && <span className="text-xs text-gray-400">{lang.label}</span>}
                    <button
                      type="button"
                      onClick={() => makeDefault(code)}
                      title={isDefault ? "Source language" : "Make source language"}
                      className={cn(
                        "ml-1 transition-colors",
                        isDefault ? "text-teal-600" : "text-gray-300 hover:text-amber-500",
                      )}
                    >
                      <Star className={cn("h-3.5 w-3.5", isDefault && "fill-teal-500")} />
                    </button>
                    {!isDefault && assigned.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLanguage(code)}
                        title="Remove language"
                        className="text-gray-300 hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {available.length > 0 && (
              <div className="w-56">
                <Select value="" onValueChange={(v) => v && addLanguage(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="+ Add language" />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((lang) => (
                      <SelectItem key={lang.id} value={lang.name}>
                        <span className="font-semibold uppercase">{lang.name}</span>
                        {lang.label && <span className="ml-2 text-muted-foreground">{lang.label}</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parameters */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Redemption parameters</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Asked when a student redeems a license. Up to {MAX_PARAMETERS}.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addParam}
              disabled={params.length >= MAX_PARAMETERS}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add parameter ({params.length}/{MAX_PARAMETERS})
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {params.length === 0 ? (
              <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                No parameters yet.
              </div>
            ) : (
              params.map((p, pIdx) => (
                <div key={p.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      #{pIdx + 1}
                    </span>
                    <div className="flex-1">
                      <LocalizedInput
                        value={p.label}
                        onChange={(v) => updateParam(p.id, { label: v })}
                        placeholder="Parameter name (e.g. Region)"
                        className="w-full"
                      />
                    </div>
                    <Select
                      value={p.type}
                      onValueChange={(v) =>
                        updateParam(p.id, { type: (v as "single" | "multiple") ?? "single" })
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single choice</SelectItem>
                        <SelectItem value="multiple">Multiple choice</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeParam(p.id)}
                      title="Remove parameter"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Options */}
                  <div className="space-y-1.5 pl-6">
                    {p.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 border border-muted-foreground/40",
                            p.type === "single" ? "rounded-full" : "rounded-[3px]",
                          )}
                        />
                        <div className="max-w-xs flex-1">
                          <LocalizedInput
                            value={opt}
                            onChange={(v) => updateOption(p.id, oIdx, v)}
                            placeholder={`Option ${oIdx + 1}`}
                            className="w-full"
                          />
                        </div>
                        <button
                          onClick={() => removeOption(p.id, oIdx)}
                          className="text-muted-foreground/50 hover:text-muted-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addOption(p.id)}
                      className="ml-5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <Plus className="h-3 w-3" /> Add option
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Migration — super-admin only (dev → prod content transfer). */}
        {me.isSuper && (
          <MigrationCard projectId={project.id} projectName={localize(project.name, locale)} />
        )}
      </div>
    </>
  );
}

// ── Migration: export this project's content as a JSON snapshot, or import a
// snapshot (blocks, catalog groups, tests/dashboards) into this instance.
function MigrationCard({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  // Where the imported content lands:
  //  recreate — recreate the exported project itself (keep its id) → fresh instance (prod)
  //  merge    — re-parent into the selected project, preserving ids
  //  clone    — re-parent into the selected project with fresh ids (copy within an instance)
  const [dest, setDest] = useState<"recreate" | "merge" | "clone">("recreate");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const doExport = async () => {
    if (!projectId) return;
    setExporting(true);
    setMsg(null);
    try {
      const bundle = await exportProject(projectId);
      const slug = (projectName || "project").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const blob = new Blob([JSON.stringify(bundle)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tp-export-${slug || "project"}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg({ ok: true, text: "Exported. Save this file to import into another instance." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Export failed" });
    } finally {
      setExporting(false);
    }
  };

  const doImport = async (file: File) => {
    setImporting(true);
    setMsg(null);
    try {
      const bundle = JSON.parse(await file.text()) as ProjectBundle;
      // "recreate" rebuilds the exported project as-is (no re-parenting); the
      // other two land the content in the currently-selected project.
      const counts =
        dest === "recreate"
          ? await importProject(bundle)
          : await importProject(bundle, projectId, dest);
      const created = Object.entries(counts)
        .filter(([, n]) => n > 0)
        .map(([k, n]) => `${n} ${k}`)
        .join(", ");
      const where =
        dest === "recreate"
          ? "as the exported project"
          : `into “${projectName}”${dest === "clone" ? " as a new copy" : ""}`;
      setMsg({
        ok: true,
        text: created
          ? `Imported ${where}: ${created}.`
          : "Nothing new — everything already existed.",
      });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Import failed" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Migration</CardTitle>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Move content between instances or projects. Exports the blocks, catalog groups,
          and tests/dashboards under <strong>{projectName}</strong>; choose below where an
          imported file lands. Users, organizations, licenses, and attempt results are not
          included.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={doExport} disabled={exporting}>
            {exporting ? "Exporting…" : `Export “${projectName || "project"}”`}
          </Button>
          <label
            className={cn(
              "inline-flex cursor-pointer items-center rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
              importing && "pointer-events-none opacity-60",
            )}
          >
            {importing ? "Importing…" : "Import from file…"}
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void doImport(f);
              }}
            />
          </label>
        </div>
        <div className="space-y-1.5 text-xs">
          <span className="font-medium text-muted-foreground">On import, the file should…</span>
          <label className="flex items-start gap-2">
            <input type="radio" name="dest" className="mt-0.5" checked={dest === "recreate"} onChange={() => setDest("recreate")} />
            <span className="text-muted-foreground">
              <strong>Recreate the exported project</strong> (keep its id &amp; name). For a fresh
              instance — e.g. migrating to <em>prod</em>. The target project is created if missing.
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="radio" name="dest" className="mt-0.5" checked={dest === "merge"} onChange={() => setDest("merge")} />
            <span className="text-muted-foreground">
              <strong>Merge into “{projectName}”</strong> (preserve ids). Re-parent the content into
              the selected project; skips anything already present.
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="radio" name="dest" className="mt-0.5" checked={dest === "clone"} onChange={() => setDest("clone")} />
            <span className="text-muted-foreground">
              <strong>Copy into “{projectName}” as new (regenerate ids)</strong>. For duplicating
              between projects in the <em>same</em> instance; colliding catalog-group names are auto-suffixed.
            </span>
          </label>
        </div>
        {msg && (
          <p className={cn("text-sm", msg.ok ? "text-teal-600" : "text-red-500")}>{msg.text}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Project admin: set the login + password this project's admin signs in with.
// Styled to match the org page's "Organization admin" section (a password box
// stands in for the org's activation-code box — staff sign in with a password).
function ProjectAdminCard({ projectId }: { projectId: string }) {
  const [admin, setAdmin] = useState<ProjectAdmin | null>(null);
  const [adminLogin, setAdminLogin] = useState("");
  const [adminName, setAdminName] = useState("");
  const [password, setPassword] = useState("");
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchProjectAdmin(projectId)
      .then((a) => {
        if (!active) return;
        setAdmin(a);
        setAdminLogin(a?.login ?? "");
        setAdminName(a?.name ?? "");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [projectId]);

  const saveAdmin = async () => {
    setSavingAdmin(true);
    setAdminMsg(null);
    try {
      const a = await setProjectAdmin(projectId, {
        login: adminLogin.trim(),
        name: adminName.trim() || undefined,
        password: password || undefined,
      });
      setAdmin(a);
      setPassword("");
      setAdminMsg("Saved");
    } catch (e) {
      setAdminMsg(e instanceof Error ? e.message.replace(/^PUT .*?: /, "") : "Failed to save");
    } finally {
      setSavingAdmin(false);
    }
  };

  return (
    <section className="rounded-xl border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold">Project admin</h3>
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
            <span>no admin yet — set a login and password and save</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={saveAdmin} disabled={savingAdmin || !adminLogin.trim() || (!admin && password.length < 6)}>
            {savingAdmin ? "Saving…" : "Save admin"}
          </Button>
          {adminMsg && (
            <span className={adminMsg === "Saved" ? "text-xs text-teal-600" : "text-xs text-red-500"}>{adminMsg}</span>
          )}
        </div>

        <div className="mt-2 rounded-lg border bg-muted/30 p-3">
          <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">Password</p>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={admin ? "leave blank to keep current" : "min 6 characters"}
            className="max-w-xs"
          />
          <p className="mt-1.5 text-[0.66rem] leading-relaxed text-muted-foreground">
            The project admin signs in at <code className="font-mono">/admin</code> with their login + this password. They
            see the full admin area for this project, except Access → Users. Setting a new password replaces the old one
            immediately.
          </p>
        </div>
      </div>
    </section>
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
