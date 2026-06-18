"use client";

import { useState, useMemo, useEffect } from "react";
import { useLocale } from "@/lib/locale-context";
import {
  fetchCollegePrograms,
  createCollegeProgram,
  type CollegeProgramRow,
} from "@/lib/methodic-api";
import { Plus } from "lucide-react";
import { OutputHeaderCells, OutputRowCells } from "./output-columns";

export function CollegeProgramsTab() {
  const { t, locale } = useLocale();
  const loc = locale as "en" | "ru" | "kk";
  const [search, setSearch] = useState("");
  const [programs, setPrograms] = useState<CollegeProgramRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollegePrograms()
      .then(setPrograms)
      .catch((err) => console.error("Failed to load programs:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return programs;
    const q = search.toLowerCase();
    return programs.filter((p) => {
      const title = p.name[loc] || p.name.en || "";
      const code = p.code || "";
      return title.toLowerCase().includes(q) || code.toLowerCase().includes(q);
    });
  }, [search, programs, loc]);

  async function handleAdd() {
    try {
      const created = await createCollegeProgram({
        name: { en: "", ru: "", kk: "" },
      });
      window.location.href = `/admin/catalogs/college-programs/${created.id}`;
    } catch (err) {
      console.error("Failed to create program:", err);
    }
  }

  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("cm.methodic.searchPrograms")}
          className="w-full max-w-md rounded-lg border border-gray-200 pl-3 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          {t("cm.methodic.addProgram")}
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
                    {t("cm.methodic.col.title")}
                  </th>
                  <OutputHeaderCells type="collegePrograms" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-50 hover:bg-teal-50/30 transition-colors cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/admin/catalogs/college-programs/${p.id}`)
                    }
                  >
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-gray-900">
                        {p.name[loc] || p.name.en}
                      </span>
                    </td>
                    <OutputRowCells type="collegePrograms" output={p.params?.output} />
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
