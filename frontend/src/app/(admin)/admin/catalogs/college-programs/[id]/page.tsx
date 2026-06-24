"use client";

import { use, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocale } from "@/lib/locale-context";
import { Breadcrumb } from "../../../_components/breadcrumb";
import { EditorLayout } from "../../_components/editor-layout";
import { LocalizedInput } from "../../_components/localized-input";
import { CatalogDetailScaffold } from "../../_components/catalog-detail-scaffold";
import { useContentLocale } from "../../_components/edit-language";
import { GraduationCap } from "lucide-react";
import {
  fetchCollegeProgram,
  updateCollegeProgram,
  deleteCollegeProgram,
  fetchColleges,
  type CollegeProgramRow,
  type CollegeProgramCollege,
  type CollegeRow,
  type Localized,
} from "@/lib/methodic-api";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

export default function CollegeProgramEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numId = Number(id);
  const { t, locale } = useLocale();
  const loc = locale as "en" | "ru" | "kk";

  const [prog, setProg] = useState<CollegeProgramRow | null>(null);
  const [allCols, setAllCols] = useState<CollegeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const progRef = useRef(prog);
  progRef.current = prog;

  const [showColPicker, setShowColPicker] = useState(false);
  const [colSearch, setColSearch] = useState("");

  useEffect(() => {
    Promise.all([fetchCollegeProgram(numId), fetchColleges()])
      .then(([p, c]) => {
        setProg(p);
        setAllCols(c);
      })
      .catch((err) => console.error("Failed to load:", err))
      .finally(() => setLoading(false));
  }, [numId]);

  const save = useCallback(
    async (patch: Record<string, any>) => {
      setSaving(true);
      try {
        const updated = await updateCollegeProgram(numId, patch);
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
    save({ name: p.name, code: p.code, params: p.params });
  }, [save]);

  const handleDelete = useCallback(async () => {
    if (!confirm(t("admin.catProf.confirmDeleteProgram"))) return;
    await deleteCollegeProgram(numId);
    window.location.href = "/admin/catalogs#collegePrograms";
  }, [numId, t]);

  const colMap = useMemo(() => {
    const m = new Map<number, CollegeRow>();
    allCols.forEach((c) => m.set(c.id, c));
    return m;
  }, [allCols]);

  function getColName(colId: number): string {
    const c = colMap.get(colId);
    if (!c) return t("cm.methodic.deleted");
    return c.name[loc] || c.name.en || `#${colId}`;
  }

  const selectedColIds = useMemo(
    () => new Set((prog?.params?.colleges ?? []).map((c) => c.id)),
    [prog?.params?.colleges],
  );

  const availableCols = useMemo(() => {
    let list = allCols.filter((c) => !selectedColIds.has(c.id));
    if (colSearch) {
      const q = colSearch.toLowerCase();
      list = list.filter((c) => {
        const name = c.name[loc] || c.name.en || "";
        const city = c.city?.name[loc] || c.city?.name.en || "";
        return name.toLowerCase().includes(q) || city.toLowerCase().includes(q);
      });
    }
    return list;
  }, [allCols, selectedColIds, colSearch, loc]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">{t("admin.common.loading")}</div>;
  }

  if (!prog) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">{t("admin.catProf.programNotFound")}</div>;
  }

  const colleges = prog.params?.colleges ?? [];

  function updateColleges(newColleges: CollegeProgramCollege[]) {
    if (!prog) return;
    setProg({ ...prog, params: { ...prog.params, colleges: newColleges } });
  }

  function addCollege(col: CollegeRow) {
    updateColleges([
      ...colleges,
      { id: col.id, duration: { en: "", ru: "", kk: "" } },
    ]);
    setShowColPicker(false);
    setColSearch("");
  }

  function removeCollege(colId: number) {
    updateColleges(colleges.filter((c) => c.id !== colId));
  }

  function updateDuration(colId: number, duration: Localized) {
    updateColleges(
      colleges.map((c) => (c.id === colId ? { ...c, duration } : c)),
    );
  }

  const title = prog.name[loc] || prog.name.en || "";

  const editors: number[] = Array.isArray(prog.params?.access) ? prog.params!.access : [];

  const detailsNode = (
      <EditorLayout
        editor={
          <div className="space-y-3">
            {/* Program identity */}
            <div>
              <label className="block text-[0.68rem] font-medium text-gray-500 mb-1">
                {t("cm.methodic.col.code")}
              </label>
              <input
                type="text"
                value={prog.code ?? ""}
                onChange={(e) => setProg({ ...prog, code: e.target.value })}
                onBlur={() => save({ code: progRef.current?.code ?? null })}
                className={inputClass}
              />
            </div>

            {/* Colleges */}
            <div>
              <label className="block text-[0.68rem] font-medium text-gray-500 mb-2">
                {t("cm.methodic.col.colleges")} ({colleges.length})
              </label>
              <div className="space-y-1.5">
                {colleges.map((entry) => {
                  const deleted = !colMap.has(entry.id);
                  return (
                    <div key={entry.id} className="bg-white rounded-lg border border-gray-100 px-3 py-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-medium truncate ${deleted ? "text-red-400 italic" : "text-gray-900"}`}>
                          {getColName(entry.id)}
                        </span>
                        <button type="button" onClick={() => removeCollege(entry.id)} className="shrink-0 text-gray-300 hover:text-red-400 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      {!deleted && (
                        <LocalizedInput
                          value={entry.duration}
                          onChange={(v) => updateDuration(entry.id, v)}
                          placeholder={t("cm.methodic.col.duration")}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:border-teal-400 outline-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Picker */}
              <div className="mt-2 relative">
                <button
                  type="button"
                  onClick={() => { setShowColPicker(!showColPicker); setColSearch(""); }}
                  className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
                >
                  + {t("cm.methodic.addCollege")}
                </button>
                {showColPicker && (
                  <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 relative max-h-60 overflow-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-100 p-2">
                      <input
                        type="text"
                        value={colSearch}
                        onChange={(e) => setColSearch(e.target.value)}
                        placeholder={t("cm.methodic.searchColleges")}
                        className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-900 outline-none focus:border-teal-400"
                        autoFocus
                      />
                    </div>
                    {availableCols.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => addCollege(col)}
                        className="w-full text-left px-3 py-2 hover:bg-teal-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <div className="text-sm font-medium text-gray-900">{col.name[loc] || col.name.en}</div>
                        <div className="text-xs text-gray-400">{col.city?.name[loc] || col.city?.name.en || ""}</div>
                      </button>
                    ))}
                    {availableCols.length === 0 && (
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
                {saving ? t("admin.common.saving") : t("cm.methodic.saveChanges")}
              </button>
            </div>

            <div className="border-t border-gray-100 my-1" />
          </div>
        }
        preview={<CollegeProgramPreview prog={prog} colMap={colMap} />}
      />
  );

  return (
    <CatalogDetailScaffold
      breadcrumb={
        <Breadcrumb
          items={[
            { label: t("cm.methodic.heading"), href: "/admin/catalogs" },
            { label: t("cm.methodic.tabs.collegePrograms"), href: "/admin/catalogs#collegePrograms" },
            { label: title || "—" },
          ]}
        />
      }
      title={title}
      catalog="collegePrograms"
      entityId={numId}
      saving={saving}
      titleField={{
        value: prog.name,
        onChange: (v) => setProg({ ...prog, name: v }),
        onBlur: saveName,
      }}
      descriptionField={{
        value: prog.desc ?? { en: "", ru: "", kk: "" },
        onChange: (v) => setProg({ ...prog, desc: v }),
        onBlur: () => {
          if (progRef.current) save({ desc: progRef.current.desc });
        },
      }}
      extras={{
        value: (prog.params?.output as Record<string, Localized>) ?? {},
        onChange: (next) => {
          const newParams = { ...prog.params, output: next };
          setProg({ ...prog, params: newParams });
        },
        onBlur: saveAll,
      }}
      onDelete={handleDelete}
      deleteLabel={t("admin.catProf.deleteProgram")}
      pages={[{ id: "details", label: t("admin.catProf.colleges"), icon: GraduationCap, render: detailsNode }]}
      access={{
        editors,
        onChange: (ids) => {
          const newParams = { ...(prog.params ?? {}), access: ids };
          setProg({ ...prog, params: newParams });
          save({ params: newParams });
        },
      }}
    />
  );
}

// Preview follows the page-level editing language (useContentLocale).
function CollegeProgramPreview({
  prog,
  colMap,
}: {
  prog: CollegeProgramRow;
  colMap: Map<number, CollegeRow>;
}) {
  const { t } = useLocale();
  const loc = useContentLocale();
  const title = prog.name[loc] || prog.name.en || "";
  const colleges = prog.params?.colleges ?? [];
  const getColName = (colId: number) => {
    const c = colMap.get(colId);
    if (!c) return t("cm.methodic.deleted");
    return c.name[loc] || c.name.en || `#${colId}`;
  };
  return (
    <div className="text-sm text-gray-500">
      <div className="font-bold text-gray-900 mb-1">{title || "—"}</div>
      {prog.code && <div className="font-mono text-xs text-gray-400 mb-3">{prog.code}</div>}
      {colleges.length > 0 && (
        <div>
          <div className="text-[0.68rem] font-bold text-gray-400 uppercase tracking-wider mb-2">{t("cm.methodic.col.colleges")}</div>
          <div className="space-y-1.5">
            {colleges.map((entry) => {
              const c = colMap.get(entry.id);
              const dur = entry.duration[loc] || entry.duration.en || "";
              return (
                <div key={entry.id} className="text-xs">
                  <span className={c ? "text-gray-900 font-medium" : "text-red-400 italic"}>{getColName(entry.id)}</span>
                  {dur && <span className="text-gray-400 ml-2">{dur}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
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
