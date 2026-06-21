"use client";

// Per-test drill-down — computed from real attempts of one test in this org:
// completion KPIs, average score per scale, and each student's latest result.
// Reuses buildResultEntry so the scales/summary match what the holder sees.

import { ArrowLeft, BarChart3, CheckCircle2, Clock, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrgAttempt } from "@/lib/backend";
import { buildResultEntry } from "@/lib/result-entry";

interface TestResultRow {
  studentName: string;
  date: string;
  topLabel: string;
  topValue: number;
  summary: string;
}

interface TestStats {
  students: number;
  completed: number;
  inProgress: number;
  rate: number;
  averages: { label: string; value: number }[];
  results: TestResultRow[];
}

const fmtDate = (v: string | null) => (v ? new Date(v).toLocaleDateString() : "—");

function computeTestStats(attempts: OrgAttempt[]): TestStats {
  const students = attempts.length;
  const completed = attempts.filter((a) => a.state === "COMPLETED").length;
  const inProgress = students - completed;
  const rate = students ? Math.round((completed / students) * 100) : 0;

  // Average each scale over completed attempts, and a latest-result row each.
  const sums = new Map<string, { sum: number; n: number }>();
  const results: TestResultRow[] = [];
  for (const a of attempts) {
    if (a.state !== "COMPLETED") continue;
    const date = fmtDate(a.endTime ?? a.updatedTime);
    const entry = buildResultEntry(a.test, a.variables, date);
    for (const sc of entry.scores) {
      const acc = sums.get(sc.label.en ?? "") ?? { sum: 0, n: 0 };
      acc.sum += sc.value;
      acc.n++;
      sums.set(sc.label.en ?? "", acc);
    }
    const top = [...entry.scores].sort((x, y) => y.value - x.value)[0];
    results.push({
      studentName: a.license.holder?.name || a.license.holder?.login || a.license.licenseCode,
      date,
      topLabel: top?.label.en ?? "—",
      topValue: top?.value ?? 0,
      summary: entry.summary.en ?? "",
    });
  }
  const averages = [...sums.entries()]
    .map(([label, { sum, n }]) => ({ label, value: Math.round(sum / n) }))
    .sort((a, b) => b.value - a.value);

  return { students, completed, inProgress, rate, averages, results };
}

interface Props {
  testName: string;
  attempts: OrgAttempt[];
  onBack: () => void;
}

export function TestDashboard({ testName, attempts, onBack }: Props) {
  const s = computeTestStats(attempts);
  const maxAvg = Math.max(...s.averages.map((a) => a.value), 1);

  const kpis = [
    { label: "Students", value: s.students, icon: Users, hint: "with an attempt" },
    { label: "Completed", value: s.completed, icon: CheckCircle2, hint: "finished this test" },
    { label: "In progress", value: s.inProgress, icon: Clock, hint: "started, not finished" },
    { label: "Completion rate", value: `${s.rate}%`, icon: TrendingUp, hint: `${s.completed}/${s.students} students` },
  ];

  return (
    <>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All tests
      </button>

      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight">{testName}</h2>
        <p className="text-sm text-muted-foreground">
          How students in this organization are doing on this test.
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

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Average scores by scale */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average scores</CardTitle>
          </CardHeader>
          <CardContent>
            {s.averages.length === 0 ? (
              <EmptyResults message="Averages will appear once students complete this test." />
            ) : (
              <div className="flex flex-col gap-3">
                {s.averages.map((a) => {
                  const high = a.value > 60;
                  return (
                    <div key={a.label}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className={cn("text-sm font-medium", high ? "text-foreground" : "text-muted-foreground")}>
                          {a.label}
                        </span>
                        <span className={cn("text-xs font-bold", high ? "text-primary" : "text-muted-foreground")}>
                          {a.value}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", high ? "bg-primary" : "bg-muted-foreground/40")}
                          style={{ width: `${(a.value / maxAvg) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest results per student */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent results</CardTitle>
          </CardHeader>
          <CardContent>
            {s.results.length === 0 ? (
              <EmptyResults message="No results yet for this test." />
            ) : (
              <div className="flex flex-col divide-y">
                {s.results.map((r, i) => (
                  <div key={`${r.studentName}-${i}`} className="py-3 first:pt-0 last:pb-0">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{r.studentName}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{r.date}</span>
                    </div>
                    {r.topLabel !== "—" && (
                      <span className="mb-1.5 inline-block rounded-lg border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {r.topLabel} — {r.topValue}
                      </span>
                    )}
                    {r.summary && (
                      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{r.summary}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function EmptyResults({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <BarChart3 className="mb-3 h-8 w-8 text-muted-foreground/40" />
      <p className="max-w-[280px] text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
