"use client";

import { useMemo, useState } from "react";
import { Plus, Building2, Search } from "lucide-react";
import { useProject } from "@/lib/project-context";
import { adminOrgs } from "./_components/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminOrganizationsPage() {
  const { project } = useProject();
  const [search, setSearch] = useState("");

  const orgs = useMemo(() => {
    let list = adminOrgs.filter((o) => o.projectId === project.id);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) => o.name.toLowerCase().includes(q) || o.city.toLowerCase().includes(q),
      );
    }
    return list;
  }, [project.id, search]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
          <p className="text-sm text-muted-foreground">
            Organizations in <span className="font-medium text-foreground">{project.name}</span>.
          </p>
        </div>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> Add organization
        </Button>
      </div>

      <div className="mb-5 max-w-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations…"
            className="pl-9"
          />
        </div>
      </div>

      {orgs.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          No organizations in this project.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((o) => {
            const pct = o.licensesTotal
              ? Math.round((o.licensesRedeemed / o.licensesTotal) * 100)
              : 0;
            return (
              <Card key={o.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <Badge variant={o.state === "active" ? "default" : "secondary"}>
                      {o.state}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold">{o.name}</h3>
                  <p className="text-sm text-muted-foreground">{o.city}</p>
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {o.licensesRedeemed}/{o.licensesTotal} licenses
                      </span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
