"use client";

import { useState, useMemo, useEffect } from "react";
import { useLocale } from "@/lib/locale-context";
import {
  fetchCharacteristicTypes,
  createCharacteristicType,
  type CharacteristicTypeRow,
} from "@/lib/methodic-api";
import { Plus } from "lucide-react";

export function CharacteristicsTab() {
  const { t, locale } = useLocale();
  const loc = locale as "en" | "ru" | "kz";
  const [search, setSearch] = useState("");
  const [types, setTypes] = useState<CharacteristicTypeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharacteristicTypes()
      .then(setTypes)
      .catch((err) => console.error("Failed to load characteristic types:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return types;
    const q = search.toLowerCase();
    return types.filter((t) => {
      const name = t.name[loc] || t.name.en || "";
      const desc = t.desc?.[loc] || t.desc?.en || "";
      return (
        name.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q) ||
        t.characteristics.some((c) =>
          (c.name[loc] || c.name.en || "").toLowerCase().includes(q)
        )
      );
    });
  }, [search, types, loc]);

  async function handleAdd() {
    try {
      const created = await createCharacteristicType({
        name: { en: "", ru: "", kz: "" },
      });
      window.location.href = `/admin/catalogs/characteristics/${created.id}`;
    } catch (err) {
      console.error("Failed to create:", err);
    }
  }

  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("cm.characteristics.searchPlaceholder")}
          className="w-full max-w-md rounded-lg border border-gray-200 pl-3 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          {t("cm.characteristics.addType")}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-sm text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((ct, i) => (
            <a
              key={ct.id}
              href={`/admin/catalogs/characteristics/${ct.id}`}
              className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-teal-200 hover:shadow-md transition-all group animate-stagger-fade-up"
              style={{ "--stagger-index": i } as React.CSSProperties}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: (ct.color ?? "#6b7280") + "14" }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: ct.color ?? "#6b7280" }}
                  />
                </div>
                <div>
                  <h3 className="text-[0.92rem] font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
                    {ct.name[loc] || ct.name.en || "—"}
                  </h3>
                  <p className="text-[0.72rem] text-gray-400 mt-0.5">
                    {ct.characteristics.length} {t("cm.characteristics.items")}
                  </p>
                </div>
              </div>

              {ct.desc && (ct.desc[loc] || ct.desc.en) && (
                <p className="text-[0.78rem] text-gray-500 line-clamp-2 mb-3">
                  {ct.desc[loc] || ct.desc.en}
                </p>
              )}

              <div className="flex flex-wrap gap-1.5">
                {ct.characteristics.map((c) => (
                  <span
                    key={c.id}
                    className="text-[0.65rem] font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-500"
                  >
                    {c.name[loc] || c.name.en}
                  </span>
                ))}
              </div>
            </a>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-12 text-sm text-gray-400">
              {t("cm.filters.noResults")}
            </div>
          )}
        </div>
      )}
    </>
  );
}
