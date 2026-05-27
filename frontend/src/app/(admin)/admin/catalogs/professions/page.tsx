"use client";

import { useState, useMemo } from "react";
import { Star } from "lucide-react";
import { Breadcrumb } from "../../_components/breadcrumb";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import {
  allProfessions,
  groupBadgeColors,
  type ProfessionGroup,
  type ComplexityLevel,
} from "@/app/professions/_components/mock-data";

const GROUPS: ProfessionGroup[] = [
  "Technology",
  "Healthcare",
  "Education",
  "Business",
  "Creative Arts",
  "Science",
];

const COMPLEXITIES: ComplexityLevel[] = ["low", "medium", "high"];

export default function MethodicProfessionsPage() {
  const { t, locale } = useLocale();
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [popularFilter, setPopularFilter] = useState("");
  const [complexityFilter, setComplexityFilter] = useState("");

  const hasFilters =
    search !== "" ||
    groupFilter !== "" ||
    popularFilter !== "" ||
    complexityFilter !== "";

  const filtered = useMemo(() => {
    let list = allProfessions;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          localize(p.title, locale).toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q)
      );
    }
    if (groupFilter) list = list.filter((p) => p.group === groupFilter);
    if (popularFilter === "popular") list = list.filter((p) => p.popular);
    if (popularFilter === "regular") list = list.filter((p) => !p.popular);
    if (complexityFilter)
      list = list.filter((p) => p.complexity === complexityFilter);
    return list;
  }, [search, groupFilter, popularFilter, complexityFilter, locale]);

  const complexityBadge = (level: ComplexityLevel) => {
    const styles: Record<ComplexityLevel, string> = {
      low: "bg-green-50 text-green-700",
      medium: "bg-amber-50 text-amber-700",
      high: "bg-red-50 text-red-700",
    };
    return styles[level];
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: t("cm.methodic.heading"), href: "/admin/catalogs" },
          { label: t("cm.methodic.professions") },
        ]}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("cm.methodic.searchProfessions")}
            className="w-full rounded-lg border border-gray-200 pl-3 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
          />
        </div>

        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
        >
          <option value="">{t("cm.methodic.filter.allGroups")}</option>
          {GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <select
          value={popularFilter}
          onChange={(e) => setPopularFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
        >
          <option value="">{t("cm.methodic.filter.allPopularity")}</option>
          <option value="popular">{t("cm.methodic.filter.popular")}</option>
          <option value="regular">{t("cm.methodic.filter.regular")}</option>
        </select>

        <select
          value={complexityFilter}
          onChange={(e) => setComplexityFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
        >
          <option value="">{t("cm.methodic.filter.allComplexity")}</option>
          {COMPLEXITIES.map((c) => (
            <option key={c} value={c}>
              {t(`cm.methodic.complexity.${c}`)}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setGroupFilter("");
              setPopularFilter("");
              setComplexityFilter("");
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors px-2"
          >
            {t("filter.clear")}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="py-2.5 px-4 text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider">
                  {t("cm.methodic.col.title")}
                </th>
                <th className="py-2.5 px-4 text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider">
                  {t("cm.methodic.col.code")}
                </th>
                <th className="py-2.5 px-4 text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider">
                  {t("cm.methodic.col.group")}
                </th>
                <th className="py-2.5 px-4 text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider">
                  {t("cm.methodic.col.popular")}
                </th>
                <th className="py-2.5 px-4 text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider">
                  {t("cm.methodic.col.complexity")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-50 hover:bg-teal-50/30 transition-colors cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/admin/catalogs/professions/${p.id}`)
                  }
                >
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-gray-900">
                      {localize(p.title, locale)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs text-gray-400">
                      {p.code}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={
                        "text-[0.65rem] font-semibold px-2 py-0.5 rounded-full " +
                        (groupBadgeColors[p.group] ??
                          "bg-gray-100 text-gray-600")
                      }
                    >
                      {p.group}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {p.popular && (
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={
                        "text-[0.65rem] font-semibold px-2 py-0.5 rounded-full " +
                        complexityBadge(p.complexity)
                      }
                    >
                      {t(`cm.methodic.complexity.${p.complexity}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-10 text-sm text-gray-400">
              {t("cm.filters.noResults")}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
