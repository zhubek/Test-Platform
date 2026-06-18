"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { useLocale } from "@/lib/locale-context";
import { Breadcrumb } from "../../../_components/breadcrumb";
import { LocalizedInput } from "../../_components/localized-input";
import { CatalogDetailScaffold } from "../../_components/catalog-detail-scaffold";
import {
  fetchCity,
  updateCity,
  deleteCity,
  type CityRow,
  type Localized,
} from "@/lib/methodic-api";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

export default function CityEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numId = Number(id);
  const { locale, t } = useLocale();

  const [city, setCity] = useState<CityRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const cityRef = useRef(city);
  cityRef.current = city;

  useEffect(() => {
    fetchCity(numId)
      .then(setCity)
      .catch((err) => console.error("Failed to load:", err))
      .finally(() => setLoading(false));
  }, [numId]);

  const save = useCallback(
    async (patch: Record<string, any>) => {
      setSaving(true);
      try {
        const updated = await updateCity(numId, patch);
        setCity(updated);
      } catch (err) {
        console.error("Failed to save:", err);
      } finally {
        setSaving(false);
      }
    },
    [numId],
  );

  const saveName = useCallback(() => {
    if (cityRef.current) save({ name: cityRef.current.name });
  }, [save]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this city?")) return;
    await deleteCity(numId);
    window.location.href = "/admin/catalogs#cities";
  }, [numId]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">Loading...</div>;
  }
  if (!city) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">City not found</div>;
  }

  const name = city.name[locale] || city.name.en || "";
  const editors: number[] = Array.isArray(city.access) ? city.access : [];

  return (
    <CatalogDetailScaffold
      breadcrumb={
        <Breadcrumb
          items={[
            { label: t("cm.methodic.heading"), href: "/admin/catalogs" },
            { label: t("cm.methodic.tabs.cities"), href: "/admin/catalogs#cities" },
            { label: name || "—" },
          ]}
        />
      }
      title={name}
      catalog="cities"
      entityId={numId}
      saving={saving}
      titleField={{
        value: city.name,
        onChange: (v) => setCity({ ...city, name: v }),
        onBlur: saveName,
      }}
      descriptionField={{
        value: city.desc ?? { en: "", ru: "", kk: "" },
        onChange: (v) => setCity({ ...city, desc: v }),
        onBlur: () => {
          if (cityRef.current) save({ desc: cityRef.current.desc });
        },
      }}
      extras={{
        value: (city.output as Record<string, Localized>) ?? {},
        onChange: (next) => setCity({ ...city, output: next }),
        onBlur: () => {
          if (cityRef.current) save({ output: cityRef.current.output });
        },
      }}
      onDelete={handleDelete}
      deleteLabel="Delete city"
      access={{
        editors,
        onChange: (ids) => {
          setCity({ ...city, access: ids });
          save({ access: ids });
        },
      }}
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
