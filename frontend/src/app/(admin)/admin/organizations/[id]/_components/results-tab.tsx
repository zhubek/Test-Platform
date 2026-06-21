"use client";

// Results tab — the attempts of every license in this org, so an admin can see
// who completed which test and review each holder's result in the same drawer
// the holder sees. Shared by the super-admin org page and the org-admin page
// (each passes its own api adapter).

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { defaultOrgApi, type OrgApi, type OrgAttempt, type OrgDetail } from "@/lib/backend";
import { topLabel } from "@/lib/result-entry";
import { OrgResultDrawer } from "./org-result-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiMessage } from "./licenses-tab";

const fmtDate = (v: string | null) => (v ? new Date(v).toLocaleDateString() : "—");

const STATE_BADGE: Record<OrgAttempt["state"], { label: string; variant: "default" | "secondary" | "outline" }> = {
  COMPLETED: { label: "Completed", variant: "default" },
  IN_PROGRESS: { label: "In progress", variant: "secondary" },
  NOT_STARTED: { label: "Not started", variant: "outline" },
  EXPIRED: { label: "Expired", variant: "outline" },
};

export function ResultsTab({ org, api = defaultOrgApi }: { org: OrgDetail; api?: OrgApi }) {
  const [attempts, setAttempts] = useState<OrgAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<OrgAttempt | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    api
      .fetchOrgAttempts(org.id)
      .then(setAttempts)
      .catch((e) => setError(apiMessage(e)))
      .finally(() => setLoading(false));
  }, [org.id, api]);

  useEffect(reload, [reload]);

  const open = (a: OrgAttempt) => setSelected(a);

  const rows = useMemo(
    () => [...attempts].sort((a, b) => (a.state === "COMPLETED" ? -1 : 1) - (b.state === "COMPLETED" ? -1 : 1)),
    [attempts],
  );

  return (
    <div>
      {error && <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading results…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No test attempts yet. Results appear here once your students take tests.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Test</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Top result</th>
                <th className="px-3 py-2">Completed</th>
                <th className="px-3 py-2 text-right">Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const badge = STATE_BADGE[a.state];
                const done = a.state === "COMPLETED";
                const top = done ? topLabel(a.test, a.variables) : "";
                return (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs">{a.license.holder?.login ?? "—"}</span>
                      {a.license.holder?.name && <span className="ml-1.5 text-xs text-muted-foreground">{a.license.holder.name}</span>}
                    </td>
                    <td className="px-3 py-2">{a.test.name?.en ?? "Test"}</td>
                    <td className="px-3 py-2">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-3 py-2 text-xs">{top || <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{done ? fmtDate(a.endTime ?? a.updatedTime) : "—"}</td>
                    <td className="px-3 py-2 text-right">
                      {done ? (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => open(a)}>
                          <BarChart3 className="mr-1 h-3.5 w-3.5" /> View
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <OrgResultDrawer attempt={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
