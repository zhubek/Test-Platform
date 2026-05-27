"use client";

import { useState, useMemo } from "react";
import { Plus, Star, Search } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  professions,
  professionGroups,
  characteristicTypes,
  universities,
  colleges,
  univerPrograms,
  collegePrograms,
  cities,
  type Complexity,
} from "./_components/mock-data";

const TABS = [
  "professions",
  "univerPrograms",
  "collegePrograms",
  "universities",
  "colleges",
  "cities",
  "characteristics",
] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL: Record<Tab, string> = {
  professions: "cm.catalogs.tabs.professions",
  univerPrograms: "cm.catalogs.tabs.univerPrograms",
  collegePrograms: "cm.catalogs.tabs.collegePrograms",
  universities: "cm.catalogs.tabs.universities",
  colleges: "cm.catalogs.tabs.colleges",
  cities: "cm.catalogs.tabs.cities",
  characteristics: "cm.catalogs.tabs.characteristics",
};

export default function CatalogsPage() {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>("professions");

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("cm.catalogs.heading")}</h1>
        <p className="text-sm text-muted-foreground">{t("cm.catalogs.sub")}</p>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={cn(
              "relative shrink-0 px-4 py-2.5 text-[0.82rem] font-medium transition-colors",
              tab === tb ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(TAB_LABEL[tb])}
            {tab === tb && <span className="absolute right-2 bottom-0 left-2 h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      {tab === "professions" && <ProfessionsTab />}
      {tab === "characteristics" && <CharacteristicsTab />}
      {tab === "universities" && <SimpleTab entity="universities" rows={universities} />}
      {tab === "colleges" && <SimpleTab entity="colleges" rows={colleges} />}
      {tab === "univerPrograms" && <SimpleTab entity="univer-programs" rows={univerPrograms} />}
      {tab === "collegePrograms" && <SimpleTab entity="college-programs" rows={collegePrograms} />}
      {tab === "cities" && <SimpleTab entity="cities" rows={cities} />}
    </>
  );
}

// ── Professions: filterable table ───────────────────────────────
const complexityBadge: Record<Complexity, string> = {
  low: "bg-green-50 text-green-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700",
};

function ProfessionsTab() {
  const { t, locale } = useLocale();
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("");
  const [complexity, setComplexity] = useState("");

  const rows = useMemo(() => {
    let list = professions;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => localize(p.name, locale).toLowerCase().includes(q) || (p.code ?? "").toLowerCase().includes(q));
    }
    if (group) list = list.filter((p) => String(p.groupId) === group);
    if (complexity) list = list.filter((p) => p.complexityLevel === complexity);
    return list;
  }, [search, group, complexity, locale]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("cm.catalogs.searchProfessions")} className="pl-9" />
        </div>
        <select value={group} onChange={(e) => setGroup(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="">{t("cm.catalogs.allGroups")}</option>
          {professionGroups.map((g) => (
            <option key={g.id} value={g.id}>{localize(g.name, locale)}</option>
          ))}
        </select>
        <select value={complexity} onChange={(e) => setComplexity(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="">{t("cm.catalogs.allComplexity")}</option>
          <option value="low">{t("cm.catalogs.complexity.low")}</option>
          <option value="medium">{t("cm.catalogs.complexity.medium")}</option>
          <option value="high">{t("cm.catalogs.complexity.high")}</option>
        </select>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> {t("cm.catalogs.addProfession")}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              {["title", "code", "group", "popular", "complexity"].map((c) => (
                <th key={c} className="px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(`cm.catalogs.col.${c}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const g = professionGroups.find((x) => x.id === p.groupId);
              return (
                <tr key={p.id} className="cursor-pointer border-b last:border-0 transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3 text-sm font-medium">{localize(p.name, locale)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.code}</td>
                  <td className="px-4 py-3">{g && <Badge variant="secondary">{localize(g.name, locale)}</Badge>}</td>
                  <td className="px-4 py-3">{p.popular && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-semibold", complexityBadge[p.complexityLevel])}>
                      {t(`cm.catalogs.complexity.${p.complexityLevel}`)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">{t("cm.catalogs.noResults")}</div>}
      </div>
    </>
  );
}

// ── Characteristics: card grid ──────────────────────────────────
function CharacteristicsTab() {
  const { t, locale } = useLocale();
  const [search, setSearch] = useState("");
  const rows = useMemo(() => {
    if (!search) return characteristicTypes;
    const q = search.toLowerCase();
    return characteristicTypes.filter((c) => localize(c.name, locale).toLowerCase().includes(q));
  }, [search, locale]);

  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("cm.catalogs.searchCharacteristics")} className="pl-9" />
        </div>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> {t("cm.catalogs.addType")}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((ct) => (
          <div key={ct.id} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: ct.color + "14" }}>
                <span className="h-3 w-3 rounded-full" style={{ background: ct.color }} />
              </div>
              <div>
                <h3 className="text-[0.92rem] font-semibold">{localize(ct.name, locale)}</h3>
                <p className="mt-0.5 text-[0.72rem] text-muted-foreground">
                  {ct.characteristics.length} {t("cm.catalogs.items")}
                </p>
              </div>
            </div>
            {ct.desc && <p className="mb-3 line-clamp-2 text-[0.78rem] text-muted-foreground">{localize(ct.desc, locale)}</p>}
            <div className="flex flex-wrap gap-1.5">
              {ct.characteristics.map((c) => (
                <span key={c.id} className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                  {localize(c.name, locale)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Simple entities (universities / colleges / programs / cities) ──
function SimpleTab({
  entity,
  rows,
}: {
  entity: string;
  rows: { id: number; name: import("@/lib/localized").Localized; code?: string; city?: import("@/lib/localized").Localized; region?: import("@/lib/localized").Localized; degree?: import("@/lib/localized").Localized }[];
}) {
  const { t, locale } = useLocale();
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => localize(r.name, locale).toLowerCase().includes(q));
  }, [rows, search, locale]);

  const secondary = (r: (typeof rows)[number]) =>
    r.city ? localize(r.city, locale) : r.region ? localize(r.region, locale) : r.degree ? localize(r.degree, locale) : "";

  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("cm.catalogs.search")} className="pl-9" />
        </div>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> {t("cm.catalogs.add")}
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">{t("cm.catalogs.col.title")}</th>
              <th className="px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">{t("cm.catalogs.col.code")}</th>
              <th className="px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">{t("cm.catalogs.col.detail")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={`${entity}-${r.id}`} className="border-b last:border-0 transition-colors hover:bg-muted/40">
                <td className="px-4 py-3 text-sm font-medium">{localize(r.name, locale)}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.code ?? ""}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{secondary(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">{t("cm.catalogs.noResults")}</div>}
      </div>
    </>
  );
}
