"use client";

import { useState, useMemo, useEffect } from "react";
import { Star, Plus } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import {
  fetchProfessions,
  fetchProfessionGroups,
  createProfession,
  type ProfessionRow,
  type ProfessionGroupRow,
} from "@/lib/methodic-api";

export function ProfessionsTab() {
  const { t, locale } = useLocale();
  const loc = locale as "en" | "ru" | "kz";
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [popularFilter, setPopularFilter] = useState("");
  const [complexityFilter, setComplexityFilter] = useState("");
  const [professions, setProfessions] = useState<ProfessionRow[]>([]);
  const [groups, setGroups] = useState<ProfessionGroupRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchProfessions(), fetchProfessionGroups()])
      .then(([p, g]) => {
        setProfessions(p);
        setGroups(g);
      })
      .catch((err) => console.error("Failed to load:", err))
      .finally(() => setLoading(false));
  }, []);

  const hasFilters =
    search !== "" ||
    groupFilter !== "" ||
    popularFilter !== "" ||
    complexityFilter !== "";

  const filtered = useMemo(() => {
    let list = professions;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => {
        const name = p.name[loc] || p.name.en || "";
        const code = p.code || "";
        return name.toLowerCase().includes(q) || code.toLowerCase().includes(q);
      });
    }
    if (groupFilter) list = list.filter((p) => String(p.profGroupId) === groupFilter);
    if (popularFilter === "popular") list = list.filter((p) => p.popular);
    if (popularFilter === "regular") list = list.filter((p) => !p.popular);
    if (complexityFilter)
      list = list.filter((p) => p.complexityLevel === complexityFilter);
    return list;
  }, [search, groupFilter, popularFilter, complexityFilter, professions, loc]);

  const complexityBadge = (level: string) => {
    const styles: Record<string, string> = {
      low: "bg-green-50 text-green-700",
      medium: "bg-amber-50 text-amber-700",
      high: "bg-red-50 text-red-700",
    };
    return styles[level] ?? "bg-gray-50 text-gray-600";
  };

  const groupBadge = (groupName: string) => {
    const colors: Record<string, string> = {
      Technology: "bg-blue-50 text-blue-700",
      Healthcare: "bg-rose-50 text-rose-700",
      Education: "bg-amber-50 text-amber-700",
      Business: "bg-emerald-50 text-emerald-700",
      "Creative Arts": "bg-purple-50 text-purple-700",
      Science: "bg-cyan-50 text-cyan-700",
    };
    return colors[groupName] ?? "bg-gray-100 text-gray-600";
  };

  async function handleAdd() {
    try {
      const created = await createProfession({
        name: { en: "", ru: "", kz: "" },
      });
      window.location.href = `/admin/catalogs/professions/${created.id}`;
    } catch (err) {
      console.error("Failed to create profession:", err);
    }
  }

  return (
    <>
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
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name[loc] || g.name.en}
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
          <option value="low">{t("cm.methodic.complexity.low")}</option>
          <option value="medium">{t("cm.methodic.complexity.medium")}</option>
          <option value="high">{t("cm.methodic.complexity.high")}</option>
        </select>

        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          {t("cm.methodic.addProfession")}
        </button>

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
          {loading ? (
            <div className="text-center py-10 text-sm text-gray-400">Loading...</div>
          ) : (
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
                {filtered.map((p) => {
                  const groupName = p.profGroup?.name.en || "";
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-gray-50 hover:bg-teal-50/30 transition-colors cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/admin/catalogs/professions/${p.id}`)
                      }
                    >
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-gray-900">
                          {p.name[loc] || p.name.en}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-gray-400">
                          {p.code}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {groupName && (
                          <span
                            className={
                              "text-[0.65rem] font-semibold px-2 py-0.5 rounded-full " +
                              groupBadge(groupName)
                            }
                          >
                            {p.profGroup?.name[loc] || groupName}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {p.popular && (
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {p.complexityLevel && (
                          <span
                            className={
                              "text-[0.65rem] font-semibold px-2 py-0.5 rounded-full " +
                              complexityBadge(p.complexityLevel)
                            }
                          >
                            {t(`cm.methodic.complexity.${p.complexityLevel}`)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-10 text-sm text-gray-400">
              {t("cm.filters.noResults")}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
