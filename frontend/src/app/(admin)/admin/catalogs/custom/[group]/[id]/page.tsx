"use client";

// Generic detail editor for items of USER-CREATED catalog groups: the standard
// scaffold (Title + Description + extra variables, Pages, Access) with no
// catalog-specific views.

import { use, useState, useEffect, useCallback } from "react";
import { useLocale } from "@/lib/locale-context";
import { Breadcrumb } from "../../../../_components/breadcrumb";
import { CatalogDetailScaffold } from "../../../_components/catalog-detail-scaffold";
import { useCustomGroups, fetchCustomItem, updateCustomItem, deleteCustomItem, type CustomItemRow } from "@/lib/custom-catalogs";
import type { Localized } from "@/lib/localized";

export default function CustomItemEditorPage({
  params,
}: {
  params: Promise<{ group: string; id: string }>;
}) {
  const { group, id } = use(params);
  const { locale, t } = useLocale();
  const groups = useCustomGroups();
  const groupName = groups.find((g) => g.id === group)?.name ?? group;

  const [item, setItem] = useState<CustomItemRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomItem(group, id)
      .then(setItem)
      .catch((err) => console.error("Failed to load:", err))
      .finally(() => setLoading(false));
  }, [group, id]);

  const save = useCallback(
    async (patch: Partial<Omit<CustomItemRow, "id">>) => {
      setSaving(true);
      try {
        const updated = await updateCustomItem(group, id, patch);
        setItem({ ...updated });
      } catch (err) {
        console.error("Failed to save:", err);
      } finally {
        setSaving(false);
      }
    },
    [group, id],
  );

  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this item?")) return;
    await deleteCustomItem(group, id);
    window.location.href = `/admin/catalogs#${group}`;
  }, [group, id]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">Loading...</div>;
  }
  if (!item) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">Item not found</div>;
  }

  const name = item.name[locale] || item.name.en || "";
  const editors: number[] = Array.isArray(item.access) ? item.access : [];

  return (
    <CatalogDetailScaffold
      breadcrumb={
        <Breadcrumb
          items={[
            { label: t("cm.methodic.heading"), href: "/admin/catalogs" },
            { label: groupName, href: `/admin/catalogs#${group}` },
            { label: name || "—" },
          ]}
        />
      }
      title={name}
      catalog={group}
      entityId={id}
      saving={saving}
      titleField={{
        value: item.name,
        onChange: (v) => setItem({ ...item, name: v }),
        // Inline handlers re-bind every render, so `item` is always current.
        onBlur: () => save({ name: item.name }),
      }}
      descriptionField={{
        value: item.desc ?? { en: "", ru: "", kk: "" },
        onChange: (v) => setItem({ ...item, desc: v }),
        onBlur: () => save({ desc: item.desc }),
      }}
      extras={{
        value: (item.output as Record<string, Localized>) ?? {},
        onChange: (next) => setItem({ ...item, output: next }),
        onBlur: () => save({ output: item.output }),
      }}
      characteristics={{
        value: item.characteristics ?? {},
        onChange: (next) => setItem({ ...item, characteristics: next }),
        onBlur: () => save({ characteristics: item.characteristics }),
      }}
      onDelete={handleDelete}
      deleteLabel="Delete item"
      access={{
        editors,
        onChange: (ids) => {
          setItem({ ...item, access: ids });
          save({ access: ids });
        },
      }}
    />
  );
}
