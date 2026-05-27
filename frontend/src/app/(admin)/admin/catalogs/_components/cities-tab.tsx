"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/lib/locale-context";
import {
  fetchCities,
  createCity,
  updateCity,
  deleteCity,
  type CityRow,
  type Localized,
} from "@/lib/methodic-api";
import { LocalizedInput } from "./localized-input";
import { Trash2 } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

export function CitiesTab() {
  const { locale, t } = useLocale();
  const [cities, setCities] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState<Localized>({ en: "", ru: "", kz: "" });

  useEffect(() => {
    fetchCities()
      .then(setCities)
      .catch((err) => console.error("Failed to load cities:", err))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!newName.en && !newName.ru && !newName.kz) return;
    try {
      const created = await createCity({ name: newName });
      setCities((prev) => [...prev, created]);
      setNewName({ en: "", ru: "", kz: "" });
    } catch (err) {
      console.error("Failed to create city:", err);
    }
  }

  async function handleUpdate(id: number, name: Localized) {
    try {
      const updated = await updateCity(id, { name });
      setCities((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      console.error("Failed to update city:", err);
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
        <div className="flex-1 max-w-md">
          <label className="block text-[0.68rem] font-medium text-gray-500 mb-1">
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
          disabled={!newName.en && !newName.ru && !newName.kz}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {t("cm.methodic.cities.add")}
        </button>
      </div>

      {/* Cities list */}
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
                  <th className="py-2.5 px-4 text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider w-12">
                    #
                  </th>
                  <th className="py-2.5 px-4 text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider">
                    {t("cm.methodic.col.name")}
                  </th>
                  <th className="py-2.5 px-4 w-12" />
                </tr>
              </thead>
              <tbody>
                {cities.map((c) => (
                  <CityRow
                    key={c.id}
                    city={c}
                    locale={locale}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          )}

          {!loading && cities.length === 0 && (
            <div className="text-center py-10 text-sm text-gray-400">
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
  onUpdate,
  onDelete,
}: {
  city: CityRow;
  locale: string;
  onUpdate: (id: number, name: Localized) => void;
  onDelete: (id: number) => void;
}) {
  const [name, setName] = useState<Localized>(city.name);

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="py-2.5 px-4 text-xs text-gray-400">{city.id}</td>
      <td className="py-2.5 px-4">
        <LocalizedInput
          value={name}
          onChange={(val) => setName(val)}
          className={inputClass}
        />
      </td>
      <td className="py-2.5 px-4">
        <div className="flex items-center gap-1">
          {(name.en !== city.name.en ||
            name.ru !== city.name.ru ||
            name.kz !== city.name.kz) && (
            <button
              onClick={() => onUpdate(city.id, name)}
              className="text-xs text-teal-600 hover:text-teal-800 font-medium transition-colors"
            >
              Save
            </button>
          )}
          <button
            onClick={() => onDelete(city.id)}
            className="p-1 text-gray-300 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
