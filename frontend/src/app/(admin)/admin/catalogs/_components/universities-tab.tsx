"use client";

import { useState, useMemo, useEffect } from "react";
import { useLocale } from "@/lib/locale-context";
import {
  fetchUniversities,
  createUniversity,
  type UniversityRow,
} from "@/lib/methodic-api";
import { Plus } from "lucide-react";

export function UniversitiesTab() {
  const { locale, t } = useLocale();
  const [search, setSearch] = useState("");
  const [universities, setUniversities] = useState<UniversityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUniversities()
      .then(setUniversities)
      .catch((err) => console.error("Failed to load universities:", err))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    try {
      const created = await createUniversity({
        name: { en: "", ru: "", kz: "" },
        type: "public",
      });
      window.location.href = `/admin/catalogs/universities/${created.id}`;
    } catch (err) {
      console.error("Failed to create university:", err);
    }
  }

  const filtered = useMemo(() => {
    if (!search) return universities;
    const q = search.toLowerCase();
    return universities.filter((u) => {
      const name = u.name[locale] || u.name.en || "";
      const city = u.city?.name[locale] || u.city?.name.en || "";
      return name.toLowerCase().includes(q) || city.toLowerCase().includes(q);
    });
  }, [search, universities, locale]);

  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("cm.methodic.searchUniversities")}
          className="w-full max-w-md rounded-lg border border-gray-200 pl-3 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          {t("cm.methodic.addUniversity")}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-10 text-sm text-gray-400">
              Loading...
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="py-2.5 px-4 text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider">
                    {t("cm.methodic.col.name")}
                  </th>
                  <th className="py-2.5 px-4 text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider">
                    {t("cm.methodic.col.city")}
                  </th>
                  <th className="py-2.5 px-4 text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider">
                    {t("cm.methodic.col.type")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-50 hover:bg-teal-50/30 transition-colors cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/admin/catalogs/universities/${u.id}`)
                    }
                  >
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-gray-900">
                        {u.name[locale] || u.name.en}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-500">
                        {u.city?.name[locale] || u.city?.name.en || ""}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.type && (
                        <span
                          className={
                            "text-[0.65rem] font-semibold px-2 py-0.5 rounded-full " +
                            (u.type === "public"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-violet-50 text-violet-700")
                          }
                        >
                          {t(`cm.methodic.type.${u.type}`)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
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
