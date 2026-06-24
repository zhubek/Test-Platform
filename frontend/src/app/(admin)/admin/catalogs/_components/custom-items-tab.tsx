"use client";

// Items table for a USER-CREATED catalog group: title column + the group's
// first five extra variables, same layout as the built-in catalog tables.

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { OutputHeaderCells, OutputRowCells } from "./output-columns";
import { createCustomItem, fetchCustomItems, type CustomItemRow } from "@/lib/custom-catalogs";

export function CustomItemsTab({ group }: { group: string }) {
  const { t, locale } = useLocale();
  const loc = locale as "en" | "ru" | "kk";
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<CustomItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomItems(group)
      .then(setRows)
      .catch((err) => console.error("Failed to load items:", err))
      .finally(() => setLoading(false));
  }, [group]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => (r.name[loc] || r.name.en || "").toLowerCase().includes(q));
  }, [rows, search, loc]);

  async function handleAdd() {
    try {
      const created = await createCustomItem(group);
      window.location.href = `/admin/catalogs/custom/${group}/${created.id}`;
    } catch (err) {
      console.error("Failed to create item:", err);
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-2.5 sm:flex-row">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.common.search")}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" /> {t("admin.catUi.addItem")}
        </button>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-400">{t("admin.common.loading")}</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-gray-400">
                    {t("cm.methodic.col.title")}
                  </th>
                  <OutputHeaderCells type={group} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-teal-50/30"
                    onClick={() => (window.location.href = `/admin/catalogs/custom/${group}/${r.id}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        {r.name[loc] || r.name.en || <span className="italic text-gray-300">{t("admin.catUi.untitled")}</span>}
                      </span>
                    </td>
                    <OutputRowCells type={group} output={r.output} />
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-400">
              {t("admin.catUi.noItemsYet")}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
