"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  orgLicenses as seed,
  availableTests,
  licenseResults,
  type OrgLicense,
  type LicenseState,
  type LicenseTest,
} from "./mock-data";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResultsDrawer, type DrawerData } from "./results-drawer";
import { LicenseActions } from "./license-actions";

const testName = (id: number) =>
  availableTests.find((t) => t.id === id)?.name ?? `Test ${id}`;

function TestTag({ test, onClick }: { test: LicenseTest; onClick: () => void }) {
  const completed = test.status === "completed";
  const label = testName(test.testId);
  return (
    <button
      onClick={onClick}
      title={`${label} (${completed ? "Completed" : "Assigned"}) — view results`}
      className={cn(
        "relative inline-flex cursor-pointer items-center rounded-md px-2.5 py-1 text-[0.7rem] font-medium transition-all hover:brightness-95",
        completed ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800",
      )}
    >
      {label}
      <span
        className={cn(
          "absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-[1.5px] border-background text-[0.5rem] font-bold text-white",
          completed ? "bg-emerald-500" : "bg-amber-500",
        )}
      >
        {completed ? <Check className="h-2 w-2" /> : "!"}
      </span>
    </button>
  );
}

const stateBadge: Record<LicenseState, { label: string; variant: "default" | "secondary" | "outline"; className?: string }> = {
  redeemed: { label: "Redeemed", variant: "default", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" },
  unredeemed: { label: "Unredeemed", variant: "secondary" },
  expired: { label: "Expired", variant: "outline", className: "text-muted-foreground" },
};

export function LicensesTable() {
  const [licenses, setLicenses] = useState<OrgLicense[]>(seed);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");

  // inline name editing
  const [editCell, setEditCell] = useState<{ id: string; field: "name" } | null>(null);

  // results drawer
  const [drawerData, setDrawerData] = useState<DrawerData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openResults = useCallback((lic: OrgLicense, test: LicenseTest) => {
    const attempts = licenseResults[lic.id]?.[test.testId] ?? [];
    setDrawerData({
      studentName: lic.name || lic.code,
      testLabel: testName(test.testId),
      status: test.status,
      attempts,
    });
    setDrawerOpen(true);
  }, []);

  const filtered = useMemo(() => {
    let list = licenses;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) => l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q),
      );
    }
    if (stateFilter !== "all") list = list.filter((l) => l.state === stateFilter);
    return list;
  }, [licenses, search, stateFilter]);

  const update = useCallback((id: string, patch: Partial<OrgLicense>) => {
    setLicenses((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const hasFilters = search !== "" || stateFilter !== "all";

  return (
    <>
      {/* Filters */}
      <div className="mb-5 flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or code…"
            className="pl-9"
          />
        </div>
        <Select value={stateFilter} onValueChange={(v) => setStateFilter(v ?? "all")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            <SelectItem value="redeemed">Redeemed</SelectItem>
            <SelectItem value="unredeemed">Unredeemed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setStateFilter("all");
            }}
            className="inline-flex items-center gap-1 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <h2 className="text-base font-semibold">Licenses</h2>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {filtered.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                {["License code", "Name", "State", "Accessible tests", "Actions"].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      "px-3 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground",
                      h === "Actions" && "text-right",
                    )}
                  >
                    {h === "Actions" ? <span className="sr-only">{h}</span> : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lic) => (
                <tr key={lic.id} className="border-b last:border-0 hover:bg-muted/40">
                  {/* code */}
                  <td className="px-3 py-3">
                    <span className="font-mono text-xs text-muted-foreground">{lic.code}</span>
                  </td>

                  {/* name (inline edit) */}
                  <td className="px-3 py-3">
                    {editCell?.id === lic.id && editCell.field === "name" ? (
                      <Input
                        autoFocus
                        defaultValue={lic.name}
                        className="h-7 w-40"
                        onBlur={(e) => {
                          update(lic.id, { name: e.target.value });
                          setEditCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          if (e.key === "Escape") setEditCell(null);
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => setEditCell({ id: lic.id, field: "name" })}
                        className={cn(
                          "rounded px-1 py-0.5 text-sm hover:bg-muted",
                          lic.name ? "text-foreground" : "italic text-muted-foreground",
                        )}
                      >
                        {lic.name || "— unassigned"}
                      </button>
                    )}
                  </td>

                  {/* state */}
                  <td className="px-3 py-3">
                    <Badge
                      variant={stateBadge[lic.state].variant}
                      className={stateBadge[lic.state].className}
                    >
                      {stateBadge[lic.state].label}
                    </Badge>
                  </td>

                  {/* accessible tests — status tags (completed / assigned) */}
                  <td className="px-3 py-3">
                    {lic.tests.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex max-w-md flex-wrap gap-2">
                        {lic.tests.map((tt) => (
                          <TestTag
                            key={tt.testId}
                            test={tt}
                            onClick={() => openResults(lic, tt)}
                          />
                        ))}
                      </div>
                    )}
                  </td>

                  {/* actions */}
                  <td className="px-3 py-3">
                    <div className="flex justify-end">
                      <LicenseActions license={lic} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No licenses match your filters.
            </div>
          )}
        </div>
      </div>

      <ResultsDrawer
        open={drawerOpen}
        data={drawerData}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
