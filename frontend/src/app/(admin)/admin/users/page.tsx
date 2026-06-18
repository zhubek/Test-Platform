"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { createUser, fetchUsersForProject, type UserListRow } from "@/lib/backend";
import { useProject } from "@/lib/project-context";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiMessage } from "../organizations/[id]/_components/licenses-tab";

const COLUMNS = ["Login", "Email", "Role", "Organization", "License"] as const;

export default function AdminUsersPage() {
  const { project } = useProject();
  const { locale } = useLocale();
  const [search, setSearch] = useState("");
  const [allUsers, setAllUsers] = useState<UserListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const reload = useCallback(() => {
    if (!project?.id) return;
    setLoading(true);
    fetchUsersForProject(project.id)
      .then(setAllUsers)
      .catch((e) => console.error("Failed to load users:", e))
      .finally(() => setLoading(false));
  }, [project?.id]);

  useEffect(reload, [reload]);

  const users = useMemo(() => {
    if (!search) return allUsers;
    const q = search.toLowerCase();
    return allUsers.filter((u) =>
      [u.login, u.email, u.role, u.organization, u.license].some((v) =>
        (v ?? "").toLowerCase().includes(q),
      ),
    );
  }, [allUsers, search]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Users in <span className="font-medium text-foreground">{localize(project.name, locale)}</span>.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add user
        </Button>
      </div>

      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} projectId={project?.id} onCreated={reload} />

      <div className="mb-5 max-w-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-gray-100">
              {COLUMNS.map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-gray-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50/50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.login}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.email || <Dash />}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.organization || <Dash />}</td>
                <td className="px-4 py-3 text-sm">
                  {u.license ? (
                    <span className="font-mono text-xs text-gray-600">{u.license}</span>
                  ) : (
                    <Dash />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            {loading ? "Loading users…" : "No users found."}
          </div>
        )}
      </div>
    </>
  );
}

function Dash() {
  return <span className="text-gray-300">—</span>;
}

// Staff users (active immediately, password login). Org admins and license
// holders are provisioned from their organization instead.
function AddUserDialog({
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
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"SUPER_ADMIN" | "PROJECT_ADMIN">("PROJECT_ADMIN");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setLogin("");
      setEmail("");
      setName("");
      setPassword("");
      setRole("PROJECT_ADMIN");
      setError(null);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await createUser({
        login: login.trim(),
        email: email.trim(),
        password,
        name: name.trim() || undefined,
        role,
        // Project admins are scoped to the current project; super admins are global.
        projectId: role === "PROJECT_ADMIN" ? projectId : undefined,
        projectRole: role === "PROJECT_ADMIN" ? "PROJECT_ADMIN" : undefined,
      });
      onCreated();
      close(false);
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const valid = login.trim() && email.trim().includes("@") && password.length >= 8;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Staff account with password login. Org admins and test-takers are created from their organization.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <UField label="Login">
              <Input value={login} onChange={(e) => setLogin(e.target.value)} className="font-mono" />
            </UField>
            <UField label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
            </UField>
          </div>
          <UField label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </UField>
          <div className="grid grid-cols-2 gap-3">
            <UField label="Password (min 8)">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </UField>
            <UField label="Role">
              <Select value={role} onValueChange={(v) => setRole((v as "SUPER_ADMIN" | "PROJECT_ADMIN") ?? "PROJECT_ADMIN")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROJECT_ADMIN">Project admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super admin</SelectItem>
                </SelectContent>
              </Select>
            </UField>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !valid}>
            {busy ? "Creating…" : "Create user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
