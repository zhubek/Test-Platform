"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  availableTests,
  type OrgLicense,
} from "@/app/(orgadmin)/org-admin/licenses/_components/mock-data";
import { CompletionChart, type CompletionDatum } from "./completion-chart";
import { TestDashboard } from "./test-dashboard";

interface TestSummary {
  id: number;
  name: string;
  completed: number;
  total: number;
  rate: number;
}

function computeStats(licenses: OrgLicense[]) {
  const total = licenses.length;
  const redeemed = licenses.filter((l) => l.state === "redeemed").length;
  const unredeemed = licenses.filter((l) => l.state === "unredeemed").length;

  let testsCompleted = 0;
  let testsTotal = 0;
  for (const l of licenses) {
    for (const t of l.tests) {
      testsTotal++;
      if (t.status === "completed") testsCompleted++;
    }
  }
  const completionRate = testsTotal ? Math.round((testsCompleted / testsTotal) * 100) : 0;

  const tests: TestSummary[] = availableTests.map((at) => {
    let completed = 0;
    let tot = 0;
    for (const l of licenses) {
      const t = l.tests.find((x) => x.testId === at.id);
      if (t) {
        tot++;
        if (t.status === "completed") completed++;
      }
    }
    return {
      id: at.id,
      name: at.name,
      completed,
      total: tot,
      rate: tot ? Math.round((completed / tot) * 100) : 0,
    };
  });

  const perTest: CompletionDatum[] = tests.map((t) => ({
    // shorten label for chart
    test: t.name.split(" ")[0],
    completed: t.completed,
    total: t.total,
  }));

  return { total, redeemed, unredeemed, completionRate, testsCompleted, testsTotal, tests, perTest };
}

export function OrgDashboard({ licenses }: { licenses: OrgLicense[] }) {
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);

  const selected = availableTests.find((t) => t.id === selectedTestId);
  if (selected) {
    return (
      <TestDashboard
        testId={selected.id}
        testName={selected.name}
        licenses={licenses}
        onBack={() => setSelectedTestId(null)}
      />
    );
  }

  const s = computeStats(licenses);

  const kpis = [
    { label: "Total licenses", value: s.total, icon: Users, hint: `${s.redeemed} redeemed` },
    { label: "Redeemed", value: s.redeemed, icon: CheckCircle2, hint: s.total ? `${Math.round((s.redeemed / s.total) * 100)}% of pool` : "—" },
    { label: "Unredeemed", value: s.unredeemed, icon: Clock, hint: "awaiting students" },
    { label: "Test completion", value: `${s.completionRate}%`, icon: TrendingUp, hint: `${s.testsCompleted}/${s.testsTotal} tests done` },
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

      {/* Available tests — click one to drill into its dashboard */}
      <div className="mb-6">
        <h2 className="mb-3 text-base font-semibold">Tests</h2>
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
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${t.rate}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Completion chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Completion by test</CardTitle>
        </CardHeader>
        <CardContent>
          <CompletionChart data={s.perTest} />
        </CardContent>
      </Card>
    </>
  );
}
