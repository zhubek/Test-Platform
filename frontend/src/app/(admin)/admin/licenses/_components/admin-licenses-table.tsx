"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import {
  fetchProjectLicenses,
  type AdminLicenseRow,
  type AdminLicenseState,
} from "@/lib/backend";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const stateBadge: Record<
  AdminLicenseState,
  { label: string; variant: "default" | "secondary" | "outline"; className?: string }
> = {
  redeemed: { label: "Redeemed", variant: "default", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" },
  unredeemed: { label: "Unredeemed", variant: "secondary" },
  expired: { label: "Expired", variant: "outline", className: "text-muted-foreground" },
  revoked: { label: "Revoked", variant: "outline", className: "text-red-600" },
};

export function AdminLicensesTable({ projectId }: { projectId: string }) {
  const [licenses, setLicenses] = useState<AdminLicenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetchProjectLicenses(projectId)
      .then(setLicenses)
      .catch((e) => console.error("Failed to load licenses:", e))
      .finally(() => setLoading(false));
  }, [projectId]);

  const filtered = useMemo(() => {
    let list = licenses;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q) ||
          l.login.toLowerCase().includes(q),
      );
    }
    if (stateFilter !== "all") list = list.filter((l) => l.state === stateFilter);
    return list;
  }, [licenses, search, stateFilter]);

  const hasFilters = search !== "" || stateFilter !== "all";

  return (
    <>
      <div className="mb-5 flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, login, or code…"
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
            <SelectItem value="revoked">Revoked</SelectItem>
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
                {["License code", "Login", "Name", "State"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lic) => (
                <tr key={lic.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-3 py-3">
                    <span className="font-mono text-xs text-muted-foreground">{lic.code}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "font-mono text-xs",
                        lic.login ? "text-foreground" : "italic text-muted-foreground",
                      )}
                    >
                      {lic.login || "— not set"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm">
                    {lic.name || <span className="italic text-muted-foreground">— unassigned</span>}
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={stateBadge[lic.state].variant} className={stateBadge[lic.state].className}>
                      {stateBadge[lic.state].label}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {loading ? "Loading licenses…" : "No licenses match your filters."}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
