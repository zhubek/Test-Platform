"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Building2, Search } from "lucide-react";
import { useProject } from "@/lib/project-context";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { createOrganization, fetchOrganizations } from "@/lib/backend";
import type { AdminOrg } from "./_components/mock-data";
import { Card, CardContent } from "@/components/ui/card";
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
import { apiMessage, CopyCode } from "./[id]/_components/licenses-tab";

export default function AdminOrganizationsPage() {
  const { project } = useProject();
  const { locale } = useLocale();
  const [search, setSearch] = useState("");
  const [orgsAll, setOrgsAll] = useState<AdminOrg[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  const reload = useCallback(() => {
    if (!project?.id) return;
    fetchOrganizations(project.id)
      .then(setOrgsAll)
      .catch((e) => console.error("Failed to load organizations:", e));
  }, [project?.id]);

  useEffect(reload, [reload]);

  const orgs = useMemo(() => {
    if (!search) return orgsAll;
    const q = search.toLowerCase();
    return orgsAll.filter(
      (o) => o.name.toLowerCase().includes(q) || o.city.toLowerCase().includes(q),
    );
  }, [orgsAll, search]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
          <p className="text-sm text-muted-foreground">
            Organizations in <span className="font-medium text-foreground">{localize(project.name, locale)}</span>.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add organization
        </Button>
      </div>

      <AddOrganizationDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        projectId={project?.id}
        onCreated={reload}
      />

      <div className="mb-5 max-w-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations…"
            className="pl-9"
          />
        </div>
      </div>

      {orgs.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          No organizations in this project.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((o) => {
            const pct = o.licensesTotal
              ? Math.round((o.licensesRedeemed / o.licensesTotal) * 100)
              : 0;
            return (
              <Link key={o.id} href={`/admin/organizations/${o.id}`} className="block">
                <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <Badge variant={o.state === "active" ? "default" : "secondary"}>
                      {o.state}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold">{o.name}</h3>
                  <p className="text-sm text-muted-foreground">{o.city}</p>
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {o.licensesRedeemed}/{o.licensesTotal} licenses
                      </span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

// Create the org + its pending admin; the returned activation code is shown
// ONCE here (the admin uses it to set their password).
function AddOrganizationDialog({
  open,
  onOpenChange,
  projectId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  projectId?: string;
  onCreated: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [adminLogin, setAdminLogin] = useState("");
  const [adminName, setAdminName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; code: string } | null>(null);

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setName("");
      setDescription("");
      setAdminLogin("");
      setAdminName("");
      setError(null);
      setCreated(null);
    }
  };

  const submit = async () => {
    if (!projectId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await createOrganization(projectId, {
        name: name.trim(),
        description: description.trim() || undefined,
        adminLogin: adminLogin.trim(),
        adminName: adminName.trim() || undefined,
      });
      setCreated({ id: res.data.id, code: res.code });
      onCreated();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Organization created</DialogTitle>
              <DialogDescription>
                Give this activation code to <span className="font-mono">{adminLogin}</span> — they use it once to set
                their password. You can regenerate it later in Settings.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-2">
              <CopyCode code={created.code} highlight />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => close(false)}>
                Done
              </Button>
              <Button onClick={() => router.push(`/admin/organizations/${created.id}`)}>Open organization</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add organization</DialogTitle>
              <DialogDescription>Creates the organization and its admin account (pending activation).</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Field label="Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="School #25" />
              </Field>
              <Field label="Description / city">
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Almaty" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Admin login">
                  <Input
                    value={adminLogin}
                    onChange={(e) => setAdminLogin(e.target.value)}
                    placeholder="school25-admin"
                    className="font-mono"
                  />
                </Field>
                <Field label="Admin name">
                  <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Optional" />
                </Field>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={busy || !name.trim() || !adminLogin.trim()}>
                {busy ? "Creating…" : "Create organization"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
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
