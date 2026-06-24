"use client";

// Characteristic group detail — backed by the dc backend. Names/descriptions
// are plain single-language strings (translation handled separately).

import { use, useState, useEffect, useCallback } from "react";
import { Archive, ArchiveRestore, Plus } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { Breadcrumb } from "../../../_components/breadcrumb";
import {
  fetchCharacteristicGroup,
  updateCharacteristicGroup,
  createCharacteristic,
  updateCharacteristic,
  type DcCharacteristicGroup,
  type DcCharacteristic,
} from "@/lib/dc-catalogs";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

type Tab = "general" | "characteristics";

export default function CharacteristicGroupEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useLocale();
  const [cg, setCg] = useState<DcCharacteristicGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("general");

  useEffect(() => {
    fetchCharacteristicGroup(id)
      .then(setCg)
      .catch((err) => console.error("Failed to load:", err))
      .finally(() => setLoading(false));
  }, [id]);

  const save = useCallback(
    async (patch: { name?: string; description?: string; color?: string; archived?: boolean }) => {
      setSaving(true);
      try {
        setCg(await updateCharacteristicGroup(id, patch));
      } catch (err) {
        console.error("Failed to save:", err);
      } finally {
        setSaving(false);
      }
    },
    [id],
  );

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">{t("admin.common.loading")}</div>;
  }
  if (!cg) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">{t("admin.catPage.notFound")}</div>;
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: t("admin.catPage.catalogs"), href: "/admin/catalogs" },
          { label: t("admin.catPage.characteristics"), href: "/admin/catalogs#characteristics" },
          { label: cg.name || t("admin.catPage.untitled") },
        ]}
      />

      <div className="mb-6 flex gap-1 border-b border-gray-100">
        {(["general", "characteristics"] as const).map((t2) => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={
              "relative whitespace-nowrap px-4 py-2.5 text-[0.82rem] font-medium transition-colors " +
              (tab === t2 ? "text-gray-900" : "text-gray-400 hover:text-gray-600")
            }
          >
            {t2 === "general" ? t("admin.catPage.general") : t("admin.catPage.characteristics")}
            {tab === t2 && (
              <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gray-900" />
            )}
          </button>
        ))}
      </div>

      {tab === "general" && <GeneralTab cg={cg} setCg={setCg} save={save} saving={saving} />}
      {tab === "characteristics" && <CharacteristicsListTab cg={cg} setCg={setCg} />}
    </>
  );
}

function GeneralTab({
  cg,
  setCg,
  save,
  saving,
}: {
  cg: DcCharacteristicGroup;
  setCg: (cg: DcCharacteristicGroup) => void;
  save: (patch: { name?: string; description?: string; color?: string; archived?: boolean }) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useLocale();
  const archived = !!cg.archived;
  return (
    <div className="max-w-lg space-y-4">
      <Field label={t("admin.common.name")}>
        <input
          type="text"
          value={cg.name}
          onChange={(e) => setCg({ ...cg, name: e.target.value })}
          onBlur={() => save({ name: cg.name })}
          className={inputClass}
        />
      </Field>

      <Field label={t("admin.common.description")}>
        <input
          type="text"
          value={cg.description ?? ""}
          onChange={(e) => setCg({ ...cg, description: e.target.value })}
          onBlur={() => save({ description: cg.description ?? "" })}
          className={inputClass}
        />
      </Field>

      <Field label={t("admin.catPage.color")}>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={cg.color ?? "#6b7280"}
            onChange={(e) => setCg({ ...cg, color: e.target.value })}
            onBlur={() => save({ color: cg.color ?? "#6b7280" })}
            className="h-10 w-10 cursor-pointer rounded-lg border border-gray-200"
          />
          <input
            type="text"
            value={cg.color ?? ""}
            onChange={(e) => setCg({ ...cg, color: e.target.value })}
            onBlur={() => save({ color: cg.color ?? "" })}
            placeholder="#6b7280"
            className={inputClass + " max-w-[8rem] font-mono text-xs"}
          />
        </div>
      </Field>

      <div className="my-2 border-t border-gray-100" />

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{saving ? t("admin.common.saving") : ""}</span>
        <button
          onClick={() => {
            if (confirm(archived ? t("admin.catPage.restoreGroupConfirm") : t("admin.catPage.archiveGroupConfirm"))) {
              save({ archived: !archived });
            }
          }}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            archived ? "text-teal-600 hover:text-teal-800" : "text-amber-600 hover:text-amber-800"
          }`}
        >
          {archived ? (
            <>
              <ArchiveRestore className="h-3.5 w-3.5" /> {t("admin.catPage.restore")}
            </>
          ) : (
            <>
              <Archive className="h-3.5 w-3.5" /> {t("admin.catPage.archive")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function CharacteristicsListTab({
  cg,
  setCg,
}: {
  cg: DcCharacteristicGroup;
  setCg: (cg: DcCharacteristicGroup) => void;
}) {
  const { t } = useLocale();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  async function handleAdd() {
    if (!newName.trim()) return;
    try {
      setCg(await createCharacteristic(cg.id, { name: newName.trim(), description: newDesc.trim() }));
      setNewName("");
      setNewDesc("");
      setAdding(false);
    } catch (err) {
      console.error("Failed to create characteristic:", err);
    }
  }

  async function handleUpdate(charId: string, patch: { name?: string; description?: string; archived?: boolean }) {
    try {
      setCg(await updateCharacteristic(charId, patch));
    } catch (err) {
      console.error("Failed to update characteristic:", err);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="space-y-2">
        {cg.characteristics.map((char) => (
          <CharacteristicItem
            key={char.id}
            char={char}
            onUpdate={(patch) => handleUpdate(char.id, patch)}
          />
        ))}
      </div>

      {cg.characteristics.length === 0 && !adding && (
        <div className="py-8 text-center text-sm text-gray-400">{t("admin.catPage.noCharacteristics")}</div>
      )}

      {adding ? (
        <div className="mt-3 space-y-3 rounded-xl border border-teal-200 bg-white p-4">
          <Field label={t("admin.common.name")}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className={inputClass} autoFocus />
          </Field>
          <Field label={t("admin.common.description")}>
            <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className={inputClass} />
          </Field>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-40"
            >
              {t("admin.common.add")}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-700"
            >
              {t("admin.common.cancel")}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-teal-600 transition-colors hover:text-teal-700"
        >
          <Plus className="h-3.5 w-3.5" /> {t("admin.catPage.addCharacteristic")}
        </button>
      )}
    </div>
  );
}

function CharacteristicItem({
  char,
  onUpdate,
}: {
  char: DcCharacteristic;
  onUpdate: (patch: { name?: string; description?: string; archived?: boolean }) => void;
}) {
  const { t } = useLocale();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(char.name);
  const [desc, setDesc] = useState(char.description ?? "");

  if (editing) {
    return (
      <div className="space-y-3 rounded-xl border border-teal-200 bg-white p-4">
        <Field label={t("admin.common.name")}>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("admin.common.description")}>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} className={inputClass} />
        </Field>
        <div className="flex gap-2">
          <button
            onClick={() => {
              onUpdate({ name, description: desc });
              setEditing(false);
            }}
            className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700"
          >
            {t("admin.common.save")}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-700"
          >
            {t("admin.common.cancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 transition-colors hover:border-gray-200">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900">{char.name || "—"}</div>
        {char.description && (
          <div className="mt-0.5 line-clamp-1 text-xs text-gray-400">{char.description}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => setEditing(true)}
          className="text-xs font-medium text-teal-600 transition-colors hover:text-teal-800"
        >
          {t("admin.common.edit")}
        </button>
        <button
          onClick={() => onUpdate({ archived: true })}
          className="p-1 text-gray-300 transition-colors hover:text-amber-500"
          title={t("admin.catPage.archive")}
        >
          <Archive className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[0.68rem] font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}
