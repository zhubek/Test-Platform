"use client";

// Real sign-in gate for the /admin area. Replaces the old dev auto-login: the
// admin (super or project) signs in with login + password; the JWT lives in
// localStorage (tp-token). `me` exposes the role so the nav/scoping adapt —
// super_admin sees everything (incl. Access→Users + all projects); a
// project_admin is scoped to their one project and Users is hidden.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, getToken, signIn as apiSignIn, signOut as apiSignOut } from "./api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface AdminMe {
  id: string;
  login: string;
  name: string | null;
  projectId: string | null;
  roles: string[];
  isSuper: boolean;
}

interface BeMe {
  id: string;
  login: string;
  name: string | null;
  projectId: string | null;
  roles: { role: { name: string } }[];
}

function adapt(m: BeMe): AdminMe {
  const roles = (m.roles ?? []).map((r) => r.role.name);
  return {
    id: m.id,
    login: m.login,
    name: m.name,
    projectId: m.projectId,
    roles,
    isSuper: roles.includes("SUPER_ADMIN"),
  };
}

interface AuthCtx {
  me: AdminMe;
  signOut: () => void;
}
const Ctx = createContext<AuthCtx | null>(null);

export function useAdminAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdminAuth must be used within AdminAuthGate");
  return c;
}

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<AdminMe | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!getToken()) {
      setMe(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setMe(adapt(await apiFetch<BeMe>("/auth/me")));
    } catch {
      apiSignOut();
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>
    );
  }
  if (!me) return <LoginCard onDone={load} />;

  return <Ctx.Provider value={{ me, signOut: () => { apiSignOut(); setMe(null); } }}>{children}</Ctx.Provider>;
}

function LoginCard({ onDone }: { onDone: () => void }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await apiSignIn(login.trim(), password);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to sign in");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight">
          Test<span className="text-primary">Platform</span> admin
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in with your login and password.</p>
        <div className="mt-4 space-y-2">
          <Input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Login" className="font-mono" />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={submit} disabled={busy || !login.trim() || !password} className="w-full">
            {busy ? "…" : "Sign in"}
          </Button>
        </div>
      </div>
    </div>
  );
}
