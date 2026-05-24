"use client";

import { Users, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import {
  orgLicenses,
  availableTests,
  type OrgLicense,
} from "../licenses/_components/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompletionChart, type CompletionDatum } from "./_components/completion-chart";

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

  const perTest: CompletionDatum[] = availableTests.map((at) => {
    let completed = 0;
    let tot = 0;
    for (const l of licenses) {
      const t = l.tests.find((x) => x.testId === at.id);
      if (t) {
        tot++;
        if (t.status === "completed") completed++;
      }
    }
    // shorten label for chart
    const short = at.name.split(" ")[0];
    return { test: short, completed, total: tot };
  });

  return { total, redeemed, unredeemed, completionRate, testsCompleted, testsTotal, perTest };
}

export default function OrgDashboardPage() {
  const s = computeStats(orgLicenses);

  const kpis = [
    { label: "Total licenses", value: s.total, icon: Users, hint: `${s.redeemed} redeemed` },
    { label: "Redeemed", value: s.redeemed, icon: CheckCircle2, hint: `${Math.round((s.redeemed / s.total) * 100)}% of pool` },
    { label: "Unredeemed", value: s.unredeemed, icon: Clock, hint: "awaiting students" },
    { label: "Test completion", value: `${s.completionRate}%`, icon: TrendingUp, hint: `${s.testsCompleted}/${s.testsTotal} tests done` },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          An overview of your organization&apos;s licenses and test activity.
        </p>
      </div>

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
