"use client";

// Holder home — real-backend auth with multi-license routing:
//  · not signed in → Sign in / Register
//  · signed in, no active license → must redeem a license code
//  · exactly one active license → auto-enter it
//  · several → pick which project to enter
// The chosen project is stored (scoped token + context) so reloads land straight
// in. Tests + results are scoped to the chosen project.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Compass, LogOut, Building2, ChevronRight, KeyRound } from "lucide-react";
import {
  fetchMe,
  fetchMyTests,
  fetchMyLicenses,
  redeemLicense,
  selectLicense,
  getHolderToken,
  setHolderToken,
  getHolderContext,
  setHolderContext,
  holderLogin,
  holderRegister,
  type HolderMe,
  type HolderTest,
  type HolderLicense,
  type HolderContext,
} from "@/lib/holder-api";
import { BlockResultsDrawer } from "./_components/block-results-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HolderHome() {
  const [me, setMe] = useState<HolderMe | null>(null);
  const [licenses, setLicenses] = useState<HolderLicense[]>([]);
  const [ctx, setCtx] = useState<HolderContext | null>(null);
  const [tests, setTests] = useState<HolderTest[]>([]);
  const [resultTest, setResultTest] = useState<HolderTest | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = () => {
    setHolderToken(null);
    setMe(null);
    setLicenses([]);
    setCtx(null);
    setTests([]);
  };

  const load = useCallback(async () => {
    if (!getHolderToken()) {
      setMe(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [m, lics] = await Promise.all([fetchMe(), fetchMyLicenses()]);
      setMe(m);
      setLicenses(lics);
      const active = lics.filter((l) => l.state === "ACTIVE");

      if (active.length === 0) {
        setCtx(null);
        setTests([]);
        return;
      }

      // Resolve the chosen project: keep a valid stored choice; auto-pick a sole
      // license; otherwise leave unset so the picker shows.
      let chosen = getHolderContext();
      if (chosen && !active.some((l) => l.id === chosen!.licenseId)) chosen = null;
      if (!chosen && active.length === 1) {
        await selectLicense(active[0]);
        chosen = getHolderContext();
      }

      if (chosen) {
        setCtx(chosen);
        const t = await fetchMyTests();
        setTests(t);
        // Auto-open results for a test just finished on the take page.
        const justDone = typeof window !== "undefined" ? sessionStorage.getItem("tp-open-results") : null;
        if (justDone) {
          sessionStorage.removeItem("tp-open-results");
          const done = t.find((x) => x.id === justDone);
          if (done?.attempt) setResultTest(done);
        }
      } else {
        setCtx(null); // many active → show the picker
      }
    } catch {
      signOut();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time auth/license resolution on mount
    load();
  }, [load]);

  if (loading) return <p className="py-20 text-center text-sm text-muted-foreground">Loading…</p>;
  if (!me) return <AuthCard onDone={load} />;

  const active = licenses.filter((l) => l.state === "ACTIVE");
  if (active.length === 0) return <NoLicenseCard name={me.name || me.login} onRedeemed={load} onSignOut={signOut} />;
  if (!ctx)
    return (
      <ProjectPicker
        name={me.name || me.login}
        licenses={active}
        onPick={async (l) => {
          setLoading(true);
          await selectLicense(l);
          await load();
        }}
        onSignOut={signOut}
      />
    );

  const groups = {
    "In progress": tests.filter((t) => t.attempt?.state === "IN_PROGRESS" || t.attempt?.state === "NOT_STARTED"),
    Completed: tests.filter((t) => t.attempt?.state === "COMPLETED"),
    Available: tests.filter((t) => !t.attempt),
  };

  return (
    <>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hello, {me.name || me.login}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            {ctx.projectName}
            {ctx.orgName ? ` · ${ctx.orgName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {active.length > 1 && (
            <Button variant="ghost" size="sm" onClick={() => { setHolderContext(null); setCtx(null); }}>
              Switch project
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-1 h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>

      {tests.length === 0 && (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          No tests assigned yet for this project.
        </div>
      )}

      {Object.entries(groups).map(([label, list]) =>
        list.length === 0 ? null : (
          <section key={label} className="mb-8">
            <h2 className="mb-3 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">{label}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {list.map((t) => (
                <TestCard key={t.id} test={t} onViewResults={() => setResultTest(t)} />
              ))}
            </div>
          </section>
        ),
      )}

      <BlockResultsDrawer
        open={resultTest !== null}
        test={resultTest}
        userName={me.name || me.login}
        onClose={() => setResultTest(null)}
      />
    </>
  );
}

function TestCard({ test, onViewResults }: { test: HolderTest; onViewResults: () => void }) {
  const color = (test.info?.color as string) ?? "#4f46e5";
  const done = test.attempt?.state === "COMPLETED";
  const desc = (test.info?.description as Record<string, string> | undefined)?.en ?? "";
  return (
    <div className="flex flex-col rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: color + "20", color }}>
          <Compass className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">{test.name?.en ?? "Test"}</h3>
          <p className="text-xs text-muted-foreground">
            {test._count?.blocks ?? 0} questions · {(test.info?.duration as number) ?? "—"} min
          </p>
        </div>
      </div>
      {desc && <p className="mb-3 line-clamp-2 flex-1 text-sm text-muted-foreground">{desc}</p>}
      <div className="mt-auto flex gap-2">
        {done ? (
          <>
            <Button variant="outline" className="flex-1" onClick={onViewResults}>
              View results
            </Button>
            <Link href={`/home/take/${test.id}`}>
              <Button variant="ghost">Retake</Button>
            </Link>
          </>
        ) : (
          <Link href={`/home/take/${test.id}`} className="flex-1">
            <Button className="w-full">{test.attempt ? "Continue" : "Start test"}</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Sign in / Register ────────────────────────────────────────────────────────

function AuthCard({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [login, setLogin] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") await holderLogin(identifier.trim(), password);
      else await holderRegister(email.trim(), login.trim(), password, name.trim() || undefined);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const canSubmit =
    mode === "login"
      ? identifier.trim() && password.length > 0
      : email.trim() && login.trim() && password.length >= 6;

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight">{mode === "login" ? "Sign in" : "Create account"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login" ? "Welcome back." : "Sign up, then activate a license."}
        </p>

        <div className="my-4 inline-flex rounded-lg border bg-muted/40 p-0.5 text-sm">
          {(["login", "register"] as const).map((k) => (
            <button
              key={k}
              onClick={() => { setMode(k); setError(null); }}
              className={
                "rounded-md px-3 py-1 font-medium transition-colors " +
                (mode === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")
              }
            >
              {k === "login" ? "Sign in" : "Register"}
            </button>
          ))}
        </div>

        <div className="space-y-2" onKeyDown={(e) => e.key === "Enter" && canSubmit && submit()}>
          {mode === "login" ? (
            <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Email or login" />
          ) : (
            <>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
              <Input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Login (username)" className="font-mono" />
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" />
            </>
          )}
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "login" ? "Password" : "Password (min 6 chars)"}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={submit} disabled={busy || !canSubmit} className="w-full">
            {busy ? "…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── No active license → must redeem ───────────────────────────────────────────

function NoLicenseCard({
  name,
  onRedeemed,
  onSignOut,
}: {
  name: string;
  onRedeemed: () => void;
  onSignOut: () => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await redeemLicense(code.trim());
      onRedeemed();
    } catch (e) {
      setError(e instanceof Error ? e.message.replace(/^POST .*?: /, "") : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Hello, {name}</span>
        <Button variant="ghost" size="sm" onClick={onSignOut}>
          <LogOut className="mr-1 h-4 w-4" /> Sign out
        </Button>
      </div>
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <KeyRound className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Activate a license</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You don&apos;t have any active licenses yet. Enter a license code to get started.
        </p>
        <div className="mt-4 space-y-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="License code"
            className="font-mono"
            onKeyDown={(e) => e.key === "Enter" && code.trim() && submit()}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={submit} disabled={busy || !code.trim()} className="w-full">
            {busy ? "…" : "Activate license"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Several active licenses → pick a project ──────────────────────────────────

function ProjectPicker({
  name,
  licenses,
  onPick,
  onSignOut,
}: {
  name: string;
  licenses: HolderLicense[];
  onPick: (l: HolderLicense) => void;
  onSignOut: () => void;
}) {
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hello, {name}</h1>
          <p className="text-sm text-muted-foreground">Choose a project to enter.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onSignOut}>
          <LogOut className="mr-1 h-4 w-4" /> Sign out
        </Button>
      </div>
      <div className="space-y-2">
        {licenses.map((l) => (
          <button
            key={l.id}
            onClick={() => onPick(l)}
            className="group flex w-full items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/40"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{l.project.name}</span>
              {l.organization && (
                <span className="block truncate text-xs text-muted-foreground">{l.organization.name}</span>
              )}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-primary" />
          </button>
        ))}
      </div>
    </div>
  );
}
