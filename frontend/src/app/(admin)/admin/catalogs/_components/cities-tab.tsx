"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import {
  fetchCities,
  createCity,
  deleteCity,
  type CityRow as CityRowT,
  type Localized,
} from "@/lib/methodic-api";
import { LocalizedInput } from "./localized-input";
import { OutputHeaderCells, OutputRowCells } from "./output-columns";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

export function CitiesTab() {
  const { locale, t } = useLocale();
  const [cities, setCities] = useState<CityRowT[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState<Localized>({ en: "", ru: "", kk: "" });

  useEffect(() => {
    fetchCities()
      .then(setCities)
      .catch((err) => console.error("Failed to load cities:", err))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!newName.en && !newName.ru && !newName.kk) return;
    try {
      const created = await createCity({ name: newName });
      setCities((prev) => [...prev, created]);
      setNewName({ en: "", ru: "", kk: "" });
    } catch (err) {
      console.error("Failed to create city:", err);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm(t("cm.methodic.cities.confirmDelete"))) return;
    try {
      await deleteCity(id);
      setCities((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete city:", err);
    }
  }

  return (
    <>
      {/* Add new city */}
      <div className="mb-5 flex items-end gap-3">
        <div className="max-w-md flex-1">
          <label className="mb-1 block text-[0.68rem] font-medium text-gray-500">
            {t("cm.methodic.cities.addNew")}
          </label>
          <LocalizedInput
            value={newName}
            onChange={setNewName}
            placeholder={t("cm.methodic.cities.namePlaceholder")}
            className={inputClass}
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!newName.en && !newName.ru && !newName.kk}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("cm.methodic.cities.add")}
        </button>
      </div>

      {/* Cities list */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-400">Loading...</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-gray-400">
                    {t("cm.methodic.col.name")}
                  </th>
                  <OutputHeaderCells type="cities" />
                  <th className="w-12 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {cities.map((c) => (
                  <CityRow key={c.id} city={c} locale={locale} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          )}

          {!loading && cities.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-400">
              {t("cm.methodic.cities.empty")}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function CityRow({
  city,
  locale,
  onDelete,
}: {
  city: CityRowT;
  locale: string;
  onDelete: (id: number) => void;
}) {
  const loc = locale as "en" | "ru" | "kk";
  return (
    <tr className="border-b border-gray-50 transition-colors hover:bg-gray-50/50">
      <td className="px-4 py-3">
        <Link
          href={`/admin/catalogs/cities/${city.id}`}
          className="text-sm font-medium text-gray-900 transition-colors hover:text-teal-700"
        >
          {localize(city.name, loc) || "—"}
        </Link>
      </td>
      <OutputRowCells type="cities" output={city.output} />
      <td className="px-4 py-3">
        <button
          onClick={() => onDelete(city.id)}
          className="p-1 text-gray-300 transition-colors hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}
