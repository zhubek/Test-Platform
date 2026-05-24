"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, X, Plus, Check, ChevronDown } from "lucide-react";
import { tagColor } from "@/lib/tag-color";
import { cn } from "@/lib/utils";
import {
  orgLicenses as seed,
  availableTests,
  type OrgLicense,
  type LicenseState,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const testName = (id: number) =>
  availableTests.find((t) => t.id === id)?.name ?? `Test ${id}`;

const stateBadge: Record<LicenseState, { label: string; variant: "default" | "secondary" | "outline"; className?: string }> = {
  redeemed: { label: "Redeemed", variant: "default", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" },
  unredeemed: { label: "Unredeemed", variant: "secondary" },
  expired: { label: "Expired", variant: "outline", className: "text-muted-foreground" },
};

export function LicensesTable() {
  const [licenses, setLicenses] = useState<OrgLicense[]>(seed);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");

  // inline tag editor
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");

  // inline name/grade editing
  const [editCell, setEditCell] = useState<{ id: string; field: "name" | "grade" } | null>(null);

  const grades = useMemo(
    () => Array.from(new Set(licenses.map((l) => l.grade).filter(Boolean))).sort(),
    [licenses],
  );

  const filtered = useMemo(() => {
    let list = licenses;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) => l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q),
      );
    }
    if (gradeFilter !== "all") list = list.filter((l) => l.grade === gradeFilter);
    if (stateFilter !== "all") list = list.filter((l) => l.state === stateFilter);
    return list;
  }, [licenses, search, gradeFilter, stateFilter]);

  const update = useCallback((id: string, patch: Partial<OrgLicense>) => {
    setLicenses((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const toggleTest = useCallback(
    (id: string, testId: number) => {
      setLicenses((prev) =>
        prev.map((l) => {
          if (l.id !== id) return l;
          const has = l.accessibleTestIds.includes(testId);
          return {
            ...l,
            accessibleTestIds: has
              ? l.accessibleTestIds.filter((t) => t !== testId)
              : [...l.accessibleTestIds, testId],
          };
        }),
      );
    },
    [],
  );

  const addTag = useCallback((id: string, tag: string) => {
    const t = tag.trim();
    if (!t) return;
    setLicenses((prev) =>
      prev.map((l) =>
        l.id === id && !l.tags.includes(t) ? { ...l, tags: [...l.tags, t] } : l,
      ),
    );
    setEditingTagId(null);
    setNewTag("");
  }, []);

  const removeTag = useCallback((id: string, tag: string) => {
    setLicenses((prev) =>
      prev.map((l) => (l.id === id ? { ...l, tags: l.tags.filter((x) => x !== tag) } : l)),
    );
  }, []);

  const hasFilters = search !== "" || gradeFilter !== "all" || stateFilter !== "all";

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
        <Select value={gradeFilter} onValueChange={(v) => setGradeFilter(v ?? "all")}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All grades</SelectItem>
            {grades.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
              setGradeFilter("all");
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
                {["License code", "Name", "Grade", "State", "Accessible tests", "Tags"].map((h) => (
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

                  {/* grade (inline edit) */}
                  <td className="px-3 py-3">
                    {editCell?.id === lic.id && editCell.field === "grade" ? (
                      <Input
                        autoFocus
                        defaultValue={lic.grade}
                        className="h-7 w-20"
                        onBlur={(e) => {
                          update(lic.id, { grade: e.target.value });
                          setEditCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          if (e.key === "Escape") setEditCell(null);
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => setEditCell({ id: lic.id, field: "grade" })}
                        className="rounded px-1 py-0.5 text-sm hover:bg-muted"
                      >
                        {lic.grade || "—"}
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

                  {/* accessible tests (multi-select popover) */}
                  <td className="px-3 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex max-w-xs flex-wrap items-center gap-1 rounded-md border border-dashed px-2 py-1 text-left hover:border-solid hover:bg-muted">
                        {lic.accessibleTestIds.length === 0 ? (
                          <span className="text-xs text-muted-foreground">No tests · add</span>
                        ) : (
                          lic.accessibleTestIds.map((tid) => (
                            <span
                              key={tid}
                              className="rounded bg-primary/10 px-1.5 py-0.5 text-[0.7rem] font-medium text-primary"
                            >
                              {testName(tid)}
                            </span>
                          ))
                        )}
                        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        {availableTests.map((t) => {
                          const checked = lic.accessibleTestIds.includes(t.id);
                          return (
                            <button
                              key={t.id}
                              onClick={() => toggleTest(lic.id, t.id)}
                              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
                            >
                              <span
                                className={cn(
                                  "flex h-4 w-4 items-center justify-center rounded border",
                                  checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
                                )}
                              >
                                {checked && <Check className="h-3 w-3" />}
                              </span>
                              {t.name}
                            </button>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>

                  {/* tags (inline add/remove) */}
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      {lic.tags.map((tag) => (
                        <span
                          key={tag}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-medium",
                            tagColor(tag),
                          )}
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(lic.id, tag)}
                            className="opacity-60 hover:opacity-100"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      ))}
                      {editingTagId === lic.id ? (
                        <input
                          autoFocus
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") addTag(lic.id, newTag);
                            if (e.key === "Escape") {
                              setEditingTagId(null);
                              setNewTag("");
                            }
                          }}
                          onBlur={() => {
                            if (newTag.trim()) addTag(lic.id, newTag);
                            else {
                              setEditingTagId(null);
                              setNewTag("");
                            }
                          }}
                          placeholder="tag"
                          className="w-16 rounded-full border px-2 py-0.5 text-[0.7rem] outline-none focus:border-primary"
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingTagId(lic.id);
                            setNewTag("");
                          }}
                          className="text-muted-foreground/50 hover:text-muted-foreground"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
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
    </>
  );
}
