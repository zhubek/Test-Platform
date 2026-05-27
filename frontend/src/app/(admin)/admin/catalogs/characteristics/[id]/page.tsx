"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { useLocale } from "@/lib/locale-context";
import { Breadcrumb } from "../../../_components/breadcrumb";
import { LocalizedInput } from "../../_components/localized-input";
import {
  fetchCharacteristicType,
  updateCharacteristicType,
  createCharacteristic,
  updateCharacteristic,
  type CharacteristicTypeRow,
  type CharacteristicRow,
  type Localized,
} from "@/lib/methodic-api";
import { Archive, Plus, ArchiveRestore } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

type Tab = "general" | "characteristics";

export default function CharacteristicTypeEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numId = Number(id);
  const { t, locale } = useLocale();
  const loc = locale as "en" | "ru" | "kz";

  const [ct, setCt] = useState<CharacteristicTypeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("general");
  const ctRef = useRef(ct);
  ctRef.current = ct;

  useEffect(() => {
    fetchCharacteristicType(numId)
      .then(setCt)
      .catch((err) => console.error("Failed to load:", err))
      .finally(() => setLoading(false));
  }, [numId]);

  const save = useCallback(
    async (patch: Record<string, any>) => {
      setSaving(true);
      try {
        const updated = await updateCharacteristicType(numId, patch);
        setCt(updated);
      } catch (err) {
        console.error("Failed to save:", err);
      } finally {
        setSaving(false);
      }
    },
    [numId],
  );

  const saveName = useCallback(() => {
    if (ctRef.current) save({ name: ctRef.current.name });
  }, [save]);

  const saveDesc = useCallback(() => {
    if (ctRef.current) save({ desc: ctRef.current.desc });
  }, [save]);

  const handleArchive = useCallback(async () => {
    if (!ct) return;
    const newArchived = !ct.archived;
    const msg = newArchived
      ? t("cm.characteristics.confirmArchive")
      : t("cm.characteristics.confirmRestore");
    if (!confirm(msg)) return;
    await save({ archived: newArchived });
  }, [ct, save, t]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">Loading...</div>;
  }

  if (!ct) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">Not found</div>;
  }

  const name = ct.name[loc] || ct.name.en || "";

  return (
    <>
      <Breadcrumb
        items={[
          { label: t("cm.methodic.heading"), href: "/admin/catalogs" },
          { label: t("cm.methodic.tabs.characteristics"), href: "/admin/catalogs#characteristics" },
          { label: name || "—" },
        ]}
      />

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {(["general", "characteristics"] as const).map((t2) => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={
              "relative px-4 py-2.5 text-[0.82rem] font-medium transition-colors whitespace-nowrap " +
              (tab === t2 ? "text-gray-900" : "text-gray-400 hover:text-gray-600")
            }
          >
            {t2 === "general" ? t("cm.characteristics.tab.general") : t("cm.characteristics.tab.characteristics")}
            {tab === t2 && (
              <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gray-900" />
            )}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <GeneralTab
          ct={ct}
          setCt={setCt}
          loc={loc}
          save={save}
          saveName={saveName}
          saveDesc={saveDesc}
          saving={saving}
          onArchive={handleArchive}
          t={t}
        />
      )}

      {tab === "characteristics" && (
        <CharacteristicsListTab
          ct={ct}
          setCt={setCt}
          loc={loc}
          t={t}
        />
      )}
    </>
  );
}

function GeneralTab({
  ct,
  setCt,
  loc,
  save,
  saveName,
  saveDesc,
  saving,
  onArchive,
  t,
}: {
  ct: CharacteristicTypeRow;
  setCt: (ct: CharacteristicTypeRow) => void;
  loc: "en" | "ru" | "kz";
  save: (patch: Record<string, any>) => Promise<void>;
  saveName: () => void;
  saveDesc: () => void;
  saving: boolean;
  onArchive: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="max-w-lg space-y-4">
      <Field label={t("cm.methodic.col.name")}>
        <div onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) saveName(); }}>
          <LocalizedInput
            value={ct.name}
            onChange={(v) => setCt({ ...ct, name: v })}
            className={inputClass}
          />
        </div>
      </Field>

      <Field label={t("cm.characteristics.description")}>
        <div onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) saveDesc(); }}>
          <LocalizedInput
            value={ct.desc ?? { en: "", ru: "", kz: "" }}
            onChange={(v) => setCt({ ...ct, desc: v })}
            className={inputClass}
          />
        </div>
      </Field>

      <Field label={t("cm.characteristics.color")}>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={ct.color ?? "#6b7280"}
            onChange={(e) => setCt({ ...ct, color: e.target.value })}
            onBlur={() => save({ color: ct.color })}
            className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
          />
          <input
            type="text"
            value={ct.color ?? ""}
            onChange={(e) => setCt({ ...ct, color: e.target.value })}
            onBlur={() => save({ color: ct.color })}
            placeholder="#6b7280"
            className={inputClass + " max-w-[8rem] font-mono text-xs"}
          />
        </div>
      </Field>

      <div className="border-t border-gray-100 my-2" />

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{saving ? "Saving..." : ""}</span>
        <button
          onClick={onArchive}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            ct.archived
              ? "text-teal-600 hover:text-teal-800"
              : "text-amber-600 hover:text-amber-800"
          }`}
        >
          {ct.archived ? (
            <>
              <ArchiveRestore className="w-3.5 h-3.5" />
              {t("cm.characteristics.restore")}
            </>
          ) : (
            <>
              <Archive className="w-3.5 h-3.5" />
              {t("cm.characteristics.archive")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function CharacteristicsListTab({
  ct,
  setCt,
  loc,
  t,
}: {
  ct: CharacteristicTypeRow;
  setCt: (ct: CharacteristicTypeRow) => void;
  loc: "en" | "ru" | "kz";
  t: (key: string) => string;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState<Localized>({ en: "", ru: "", kz: "" });
  const [newDesc, setNewDesc] = useState<Localized>({ en: "", ru: "", kz: "" });

  async function handleAdd() {
    if (!newName.en && !newName.ru && !newName.kz) return;
    try {
      const created = await createCharacteristic({
        name: newName,
        desc: newDesc,
        characteristicTypeId: ct.id,
      });
      setCt({
        ...ct,
        characteristics: [...ct.characteristics, created],
      });
      setNewName({ en: "", ru: "", kz: "" });
      setNewDesc({ en: "", ru: "", kz: "" });
      setAdding(false);
    } catch (err) {
      console.error("Failed to create characteristic:", err);
    }
  }

  async function handleArchiveChar(charId: number, archived: boolean) {
    try {
      await updateCharacteristic(charId, { archived });
      setCt({
        ...ct,
        characteristics: archived
          ? ct.characteristics.filter((c) => c.id !== charId)
          : ct.characteristics,
      });
    } catch (err) {
      console.error("Failed to archive characteristic:", err);
    }
  }

  async function handleUpdateChar(charId: number, patch: Record<string, any>) {
    try {
      const updated = await updateCharacteristic(charId, patch);
      setCt({
        ...ct,
        characteristics: ct.characteristics.map((c) =>
          c.id === charId ? updated : c
        ),
      });
    } catch (err) {
      console.error("Failed to update characteristic:", err);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="space-y-2">
        {ct.characteristics.map((char) => (
          <CharacteristicItem
            key={char.id}
            char={char}
            loc={loc}
            t={t}
            onUpdate={handleUpdateChar}
            onArchive={(archived) => handleArchiveChar(char.id, archived)}
          />
        ))}
      </div>

      {ct.characteristics.length === 0 && !adding && (
        <div className="text-center py-8 text-sm text-gray-400">
          {t("cm.characteristics.empty")}
        </div>
      )}

      {adding ? (
        <div className="mt-3 bg-white rounded-xl border border-teal-200 p-4 space-y-3">
          <Field label={t("cm.methodic.col.name")}>
            <LocalizedInput
              value={newName}
              onChange={setNewName}
              className={inputClass}
              autoFocus
            />
          </Field>
          <Field label={t("cm.characteristics.description")}>
            <LocalizedInput
              value={newDesc}
              onChange={setNewDesc}
              className={inputClass}
            />
          </Field>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newName.en && !newName.ru && !newName.kz}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 transition-colors"
            >
              {t("cm.methodic.cities.add")}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("cm.characteristics.addCharacteristic")}
        </button>
      )}
    </div>
  );
}

function CharacteristicItem({
  char,
  loc,
  t,
  onUpdate,
  onArchive,
}: {
  char: CharacteristicRow;
  loc: "en" | "ru" | "kz";
  t: (key: string) => string;
  onUpdate: (id: number, patch: Record<string, any>) => void;
  onArchive: (archived: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState<Localized>(char.name);
  const [desc, setDesc] = useState<Localized>(char.desc ?? { en: "", ru: "", kz: "" });

  function handleSave() {
    onUpdate(char.id, { name, desc });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-teal-200 p-4 space-y-3">
        <Field label={t("cm.methodic.col.name")}>
          <LocalizedInput value={name} onChange={setName} className={inputClass} />
        </Field>
        <Field label={t("cm.characteristics.description")}>
          <LocalizedInput value={desc} onChange={setDesc} className={inputClass} />
        </Field>
        <div className="flex gap-2">
          <button onClick={handleSave} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors">
            {t("cm.methodic.saveChanges")}
          </button>
          <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-500 hover:text-gray-700 transition-colors">
            {t("common.cancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-start gap-3 hover:border-gray-200 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">
          {char.name[loc] || char.name.en || "—"}
        </div>
        {char.desc && (char.desc[loc] || char.desc.en) && (
          <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
            {char.desc[loc] || char.desc.en}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-teal-600 hover:text-teal-800 font-medium transition-colors"
        >
          {t("common.edit")}
        </button>
        <button
          onClick={() => onArchive(true)}
          className="p-1 text-gray-300 hover:text-amber-500 transition-colors"
          title={t("cm.characteristics.archive")}
        >
          <Archive className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[0.68rem] font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
