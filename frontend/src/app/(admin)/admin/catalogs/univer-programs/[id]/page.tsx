"use client";

import { use, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocale } from "@/lib/locale-context";
import { Breadcrumb } from "../../../_components/breadcrumb";
import { EditorLayout } from "../../_components/editor-layout";
import { LocalizedInput } from "../../_components/localized-input";
import {
  fetchUniverProgram,
  updateUniverProgram,
  deleteUniverProgram,
  fetchUniversities,
  type UniverProgramRow,
  type UniverProgramParams,
  type UniversityRow,
  type Localized,
} from "@/lib/methodic-api";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

export default function UniverProgramEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numId = Number(id);
  const { t, locale } = useLocale();
  const loc = locale as "en" | "ru" | "kz";

  const [prog, setProg] = useState<UniverProgramRow | null>(null);
  const [allUnis, setAllUnis] = useState<UniversityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const progRef = useRef(prog);
  progRef.current = prog;

  const [showUniPicker, setShowUniPicker] = useState(false);
  const [uniSearch, setUniSearch] = useState("");

  useEffect(() => {
    Promise.all([fetchUniverProgram(numId), fetchUniversities()])
      .then(([p, u]) => {
        setProg(p);
        setAllUnis(u);
      })
      .catch((err) => console.error("Failed to load:", err))
      .finally(() => setLoading(false));
  }, [numId]);

  const save = useCallback(
    async (patch: Record<string, any>) => {
      setSaving(true);
      try {
        const updated = await updateUniverProgram(numId, patch);
        setProg(updated);
      } catch (err) {
        console.error("Failed to save:", err);
      } finally {
        setSaving(false);
      }
    },
    [numId],
  );

  const saveName = useCallback(() => {
    if (progRef.current) save({ name: progRef.current.name });
  }, [save]);

  const saveAll = useCallback(() => {
    if (!progRef.current) return;
    const p = progRef.current;
    save({ name: p.name, code: p.code, subjects: p.subjects, params: p.params });
  }, [save]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this program?")) return;
    await deleteUniverProgram(numId);
    window.location.href = "/admin/catalogs#univerPrograms";
  }, [numId]);

  // University name resolver
  const uniMap = useMemo(() => {
    const m = new Map<number, UniversityRow>();
    allUnis.forEach((u) => m.set(u.id, u));
    return m;
  }, [allUnis]);

  function getUniName(uniId: number): string {
    const u = uniMap.get(uniId);
    if (!u) return t("cm.methodic.deleted");
    return u.name[loc] || u.name.en || `#${uniId}`;
  }

  const selectedUniIds = useMemo(
    () => new Set((prog?.params?.universities ?? []).map((u) => u.id)),
    [prog?.params?.universities],
  );

  const availableUnis = useMemo(() => {
    let list = allUnis.filter((u) => !selectedUniIds.has(u.id));
    if (uniSearch) {
      const q = uniSearch.toLowerCase();
      list = list.filter((u) => {
        const name = u.name[loc] || u.name.en || "";
        const city = u.city?.name[loc] || u.city?.name.en || "";
        return name.toLowerCase().includes(q) || city.toLowerCase().includes(q);
      });
    }
    return list;
  }, [allUnis, selectedUniIds, uniSearch, loc]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">Loading...</div>;
  }

  if (!prog) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">Program not found</div>;
  }

  const universities = prog.params?.universities ?? [];
  const points = prog.params?.points ?? {};

  function updateParams(newParams: Partial<UniverProgramParams>) {
    if (!prog) return;
    const merged = { ...prog.params, ...newParams };
    setProg({ ...prog, params: merged });
  }

  function addUniversity(uni: UniversityRow) {
    const current = prog?.params?.universities ?? [];
    updateParams({ universities: [...current, { id: uni.id, grant: true }] });
    setShowUniPicker(false);
    setUniSearch("");
  }

  function removeUniversity(uniId: number) {
    const current = prog?.params?.universities ?? [];
    updateParams({ universities: current.filter((u) => u.id !== uniId) });
  }

  function toggleGrant(uniId: number, grant: boolean) {
    const current = prog?.params?.universities ?? [];
    updateParams({
      universities: current.map((u) => (u.id === uniId ? { ...u, grant } : u)),
    });
  }

  function updatePointValue(key: string, index: number, value: string) {
    const newPoints = { ...points };
    const arr = [...(newPoints[key] ?? [])];
    arr[index] = Number(value) || 0;
    newPoints[key] = arr;
    updateParams({ points: newPoints });
  }

  function addPointRow() {
    const newKey = `category_${Object.keys(points).length + 1}`;
    updateParams({ points: { ...points, [newKey]: [0, 0, 0, 0, 0] } });
  }

  function removePointRow(key: string) {
    const newPoints = { ...points };
    delete newPoints[key];
    updateParams({ points: Object.keys(newPoints).length > 0 ? newPoints : undefined });
  }

  const title = prog.name[loc] || prog.name.en || "";

  return (
    <>
      <Breadcrumb
        items={[
          { label: t("cm.methodic.heading"), href: "/admin/catalogs" },
          { label: t("cm.methodic.tabs.univerPrograms"), href: "/admin/catalogs#univerPrograms" },
          { label: title || "—" },
        ]}
      />

      <EditorLayout
        editor={
          <div className="space-y-3">
            <Field label={t("cm.methodic.col.title")}>
              <div onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) saveName(); }}>
                <LocalizedInput
                  value={prog.name}
                  onChange={(v) => setProg({ ...prog, name: v })}
                  className={inputClass}
                />
              </div>
            </Field>
            <Field label={t("cm.methodic.col.code")}>
              <input
                type="text"
                value={prog.code ?? ""}
                onChange={(e) => setProg({ ...prog, code: e.target.value })}
                onBlur={() => save({ code: prog.code })}
                className={inputClass + " font-mono text-xs max-w-xs"}
              />
            </Field>
            <Field label={t("cm.methodic.col.subjects")}>
              <div onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) save({ subjects: prog.subjects }); }}>
                <LocalizedInput
                  value={prog.subjects ?? { en: "", ru: "", kz: "" }}
                  onChange={(v) => setProg({ ...prog, subjects: v })}
                  className={inputClass}
                />
              </div>
            </Field>

            {/* UNT Points */}
            <div>
              <label className="block text-[0.68rem] font-medium text-gray-500 mb-1">UNT Points</label>
              <div className="space-y-2">
                {Object.entries(points).map(([key, values]) => (
                  <div key={key} className="bg-white rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        defaultValue={key}
                        onBlur={(e) => {
                          const newKey = e.target.value.trim();
                          if (newKey && newKey !== key) {
                            const newPoints = { ...points };
                            const vals = newPoints[key];
                            delete newPoints[key];
                            newPoints[newKey] = vals;
                            updateParams({ points: newPoints });
                          }
                        }}
                        className="text-xs text-gray-600 font-medium bg-transparent border-b border-gray-200 focus:border-teal-400 outline-none px-1 py-0.5 w-24"
                      />
                      <button type="button" onClick={() => removePointRow(key)} className="text-gray-300 hover:text-red-400 transition-colors ml-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      {values.map((v, i) => (
                        <input
                          key={i}
                          type="number"
                          value={v}
                          onChange={(e) => updatePointValue(key, i, e.target.value)}
                          onBlur={() => saveAll()}
                          className="w-14 rounded border border-gray-200 px-1.5 py-1 text-xs text-center text-gray-700 focus:border-teal-400 outline-none"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => { addPointRow(); }} className="mt-2 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors">
                + {t("common.add")}
              </button>
            </div>

            {/* Universities */}
            <div>
              <label className="block text-[0.68rem] font-medium text-gray-500 mb-2">
                {t("cm.methodic.col.universities")} ({universities.length})
              </label>
              <div className="space-y-1">
                {universities.map((entry) => {
                  const deleted = !uniMap.has(entry.id);
                  return (
                    <div key={entry.id} className="flex items-center gap-2 bg-white rounded-lg border border-gray-100 px-2.5 py-1.5">
                      <span className={`text-xs font-medium truncate flex-1 min-w-0 ${deleted ? "text-red-400 italic" : "text-gray-900"}`}>
                        {getUniName(entry.id)}
                      </span>
                      {!deleted && (
                        <label className="flex items-center gap-1 shrink-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={entry.grant}
                            onChange={(e) => { toggleGrant(entry.id, e.target.checked); }}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                          />
                          <span className="text-[0.65rem] text-gray-400">{t("cm.methodic.col.grant")}</span>
                        </label>
                      )}
                      <button type="button" onClick={() => { removeUniversity(entry.id); }} className="shrink-0 text-gray-300 hover:text-red-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Picker */}
              <div className="mt-2 relative">
                <button
                  type="button"
                  onClick={() => { setShowUniPicker(!showUniPicker); setUniSearch(""); }}
                  className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
                >
                  + {t("cm.methodic.addUniversity")}
                </button>
                {showUniPicker && (
                  <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 relative max-h-60 overflow-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-100 p-2">
                      <input
                        type="text"
                        value={uniSearch}
                        onChange={(e) => setUniSearch(e.target.value)}
                        placeholder={t("cm.methodic.searchUniversities")}
                        className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-900 outline-none focus:border-teal-400"
                        autoFocus
                      />
                    </div>
                    {availableUnis.map((uni) => (
                      <button
                        key={uni.id}
                        type="button"
                        onClick={() => addUniversity(uni)}
                        className="w-full text-left px-3 py-1.5 hover:bg-teal-50 transition-colors border-b border-gray-50 last:border-0 text-xs font-medium text-gray-900"
                      >
                        {uni.name[loc] || uni.name.en}
                      </button>
                    ))}
                    {availableUnis.length === 0 && (
                      <div className="px-3 py-4 text-xs text-gray-400 text-center">—</div>
                    )}
                  </div>
                )}
              </div>

              {/* Save params button */}
              <button
                type="button"
                onClick={saveAll}
                className="mt-3 px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
              >
                {saving ? "Saving..." : t("cm.methodic.saveChanges")}
              </button>
            </div>

            <div className="border-t border-gray-100 my-1" />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-400">{saving ? "Saving..." : ""}</span>
              <button onClick={handleDelete} className="text-xs text-red-500 hover:text-red-700 transition-colors">
                Delete program
              </button>
            </div>
          </div>
        }
        preview={
          <div className="text-sm text-gray-500">
            <div className="font-bold text-gray-900 mb-1">{title || "—"}</div>
            {prog.code && <div className="font-mono text-xs text-gray-400 mb-2">{prog.code}</div>}
            {prog.subjects && <div className="text-xs text-gray-500 mb-3">{prog.subjects[loc] || prog.subjects.en}</div>}
            {universities.length > 0 && (
              <div>
                <div className="text-[0.68rem] font-bold text-gray-400 uppercase tracking-wider mb-2">{t("cm.methodic.col.universities")}</div>
                <div className="space-y-1">
                  {universities.map((entry) => {
                    const u = uniMap.get(entry.id);
                    return (
                      <div key={entry.id} className="flex items-center gap-2 text-xs">
                        <span className={u ? "text-gray-900" : "text-red-400 italic"}>{getUniName(entry.id)}</span>
                        {entry.grant && <span className="text-[0.6rem] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-semibold">{t("cm.methodic.col.grant")}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        }
      />
    </>
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
