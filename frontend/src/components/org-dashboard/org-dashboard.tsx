"use client";

// Organization dashboard — real backend data: the org's completed/in-progress
// attempts (license_test_variables) + its license pool. KPIs, per-test
// completion, and a drill-down into each test. Shared by the org-admin area and
// the super-admin org page (each passes its own api adapter).

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultOrgApi, type OrgApi, type OrgAttempt, type OrgDetail, type OrgLicense } from "@/lib/backend";
import { CompletionChart, type CompletionDatum } from "./completion-chart";
import { TestDashboard } from "./test-dashboard";

interface TestSummary {
  id: string;
  name: string;
  completed: number;
  total: number;
  rate: number;
}

function computeStats(attempts: OrgAttempt[], licenses: OrgLicense[]) {
  const total = licenses.length;
  const redeemed = licenses.filter((l) => l.state === "ACTIVE").length;
  const unredeemed = licenses.filter((l) => l.state === "ISSUED").length;

  // Group attempts by test.
  const byTest = new Map<string, { id: string; name: string; attempts: OrgAttempt[] }>();
  for (const a of attempts) {
    const e = byTest.get(a.test.id) ?? { id: a.test.id, name: a.test.name?.en ?? "Test", attempts: [] };
    e.attempts.push(a);
    byTest.set(a.test.id, e);
  }
  const tests: TestSummary[] = [...byTest.values()].map((t) => {
    const completed = t.attempts.filter((a) => a.state === "COMPLETED").length;
    const tot = t.attempts.length;
    return { id: t.id, name: t.name, completed, total: tot, rate: tot ? Math.round((completed / tot) * 100) : 0 };
  });

  const testsCompleted = attempts.filter((a) => a.state === "COMPLETED").length;
  const testsTotal = attempts.length;
  const completionRate = testsTotal ? Math.round((testsCompleted / testsTotal) * 100) : 0;
  const perTest: CompletionDatum[] = tests.map((t) => ({
    test: t.name.split(" ")[0],
    completed: t.completed,
    total: t.total,
  }));

  return { total, redeemed, unredeemed, completionRate, testsCompleted, testsTotal, tests, perTest };
}

export function OrgDashboard({ org, api = defaultOrgApi }: { org: OrgDetail; api?: OrgApi }) {
  const [attempts, setAttempts] = useState<OrgAttempt[]>([]);
  const [licenses, setLicenses] = useState<OrgLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.fetchOrgAttempts(org.id), api.fetchOrgLicenses(org.id)])
      .then(([a, l]) => {
        setAttempts(a);
        setLicenses(l);
      })
      .catch(() => {
        /* keep current view */
      })
      .finally(() => setLoading(false));
  }, [org.id, api]);

  useEffect(load, [load]);

  const s = useMemo(() => computeStats(attempts, licenses), [attempts, licenses]);

  if (loading) return <p className="py-10 text-center text-sm text-muted-foreground">Loading dashboard…</p>;

  const selected = s.tests.find((t) => t.id === selectedTestId);
  if (selected) {
    return (
      <TestDashboard
        testName={selected.name}
        attempts={attempts.filter((a) => a.test.id === selected.id)}
        onBack={() => setSelectedTestId(null)}
      />
    );
  }

  const kpis = [
    { label: "Total licenses", value: s.total, icon: Users, hint: `${s.redeemed} redeemed` },
    { label: "Redeemed", value: s.redeemed, icon: CheckCircle2, hint: s.total ? `${Math.round((s.redeemed / s.total) * 100)}% of pool` : "—" },
    { label: "Unredeemed", value: s.unredeemed, icon: Clock, hint: "awaiting students" },
    { label: "Test completion", value: `${s.completionRate}%`, icon: TrendingUp, hint: `${s.testsCompleted}/${s.testsTotal} attempts done` },
  ];

  return (
    <>
      {/* KPI cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{k.label}</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight">{k.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tests — click one to drill into its dashboard */}
      <div className="mb-6">
        <h2 className="mb-3 text-base font-semibold">Tests</h2>
        {s.tests.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            No test activity yet. Tests appear here once your students start them.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {s.tests.map((t) => (
              <Card
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedTestId(t.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedTestId(t.id);
                  }
                }}
                className="cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-semibold">{t.name}</h3>
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {t.completed}/{t.total} completed
                      </span>
                      <span className="font-semibold">{t.rate}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${t.rate}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completion chart */}
      {s.tests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completion by test</CardTitle>
          </CardHeader>
          <CardContent>
            <CompletionChart data={s.perTest} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
