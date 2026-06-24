"use client";

import { use, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocale } from "@/lib/locale-context";
import { Breadcrumb } from "../../../_components/breadcrumb";
import { EditorLayout } from "../../_components/editor-layout";
import { LocalizedInput } from "../../_components/localized-input";
import { CatalogDetailScaffold } from "../../_components/catalog-detail-scaffold";
import { GraduationCap } from "lucide-react";
import { UntChart } from "@/app/professions/[id]/_components/unt-chart";
import type { Localized as Loc } from "@/lib/localized";
import {
  fetchUniverProgram,
  updateUniverProgram,
  deleteUniverProgram,
  fetchUniversities,
  fetchCities,
  type UniverProgramRow,
  type UniverProgramParams,
  type UniversityRow,
  type CityRow,
  type Localized,
} from "@/lib/methodic-api";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

// UNT minimum points are entered by grant TYPE (rows) and YEAR (columns).
// The type keys must match the chart (unt-chart.tsx GRANT_LINES) so it renders.
const UNT_YEARS = [2021, 2022, 2023, 2024, 2025];
const UNT_TYPES: { key: string; label: string }[] = [
  { key: "general", label: "General" },
  { key: "aul", label: "Aul" },
  { key: "serpin", label: "Serpin" },
  { key: "gos", label: "Gos" },
];

export default function UniverProgramEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numId = Number(id);
  const { t, locale } = useLocale();
  const loc = locale as "en" | "ru" | "kk";

  const [prog, setProg] = useState<UniverProgramRow | null>(null);
  const [allUnis, setAllUnis] = useState<UniversityRow[]>([]);
  const [allCities, setAllCities] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const progRef = useRef(prog);
  progRef.current = prog;

  const [showUniPicker, setShowUniPicker] = useState(false);
  const [uniSearch, setUniSearch] = useState("");

  useEffect(() => {
    Promise.all([fetchUniverProgram(numId), fetchUniversities(), fetchCities()])
      .then(([p, u, c]) => {
        setProg(p);
        setAllUnis(u);
        setAllCities(c);
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
    if (!confirm(t("admin.catProf.confirmDeleteProgram"))) return;
    await deleteUniverProgram(numId);
    window.location.href = "/admin/catalogs#univerPrograms";
  }, [numId, t]);

  // University name resolver
  const uniMap = useMemo(() => {
    const m = new Map<number, UniversityRow>();
    allUnis.forEach((u) => m.set(u.id, u));
    return m;
  }, [allUnis]);

  const cityMap = useMemo(() => {
    const m = new Map<number, CityRow>();
    allCities.forEach((c) => m.set(c.id, c));
    return m;
  }, [allCities]);

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
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">{t("admin.common.loading")}</div>;
  }

  if (!prog) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">{t("admin.catProf.programNotFound")}</div>;
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

  function addPointType(typeKey: string) {
    updateParams({ points: { ...points, [typeKey]: [0, 0, 0, 0, 0] } });
  }

  function removePointRow(key: string) {
    const newPoints = { ...points };
    delete newPoints[key];
    updateParams({ points: Object.keys(newPoints).length > 0 ? newPoints : undefined });
  }

  const title = prog.name[loc] || prog.name.en || "";

  const editors: number[] = Array.isArray(prog.params?.access) ? prog.params!.access : [];

  const detailsNode = (
      <EditorLayout
        editor={
          <div className="space-y-3">
            {/* Program identity (code + UNT subjects) */}
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
            <div>
              <label className="block text-[0.68rem] font-medium text-gray-500 mb-1">
                {t("cm.methodic.col.subjects")}
              </label>
              <div onBlur={() => save({ subjects: progRef.current?.subjects ?? null })}>
                <LocalizedInput
                  value={prog.subjects ?? { en: "", ru: "", kk: "" }}
                  onChange={(v) => setProg({ ...prog, subjects: v })}
                  className={inputClass}
                />
              </div>
            </div>

            {/* UNT Points — by grant type (rows) and year (columns) */}
            <div>
              <label className="block text-[0.68rem] font-medium text-gray-500 mb-2">
                {t("admin.catProf.untMinPoints")}
              </label>

              {UNT_TYPES.some((tp) => points[tp.key]) ? (
                <>
                  {/* Year header */}
                  <div className="mb-1 flex items-center gap-1.5 pl-[84px]">
                    {UNT_YEARS.map((y) => (
                      <div key={y} className="w-14 text-center text-[0.6rem] font-semibold uppercase tracking-wider text-gray-400">
                        {y}
                      </div>
                    ))}
                  </div>
                  {/* One row per grant type */}
                  <div className="space-y-1.5">
                    {UNT_TYPES.filter((tp) => points[tp.key]).map((tp) => (
                      <div key={tp.key} className="flex items-center gap-2">
                        <span className="w-[80px] shrink-0 text-xs font-medium text-gray-600">{tp.label}</span>
                        <div className="flex gap-1.5">
                          {UNT_YEARS.map((_, i) => (
                            <input
                              key={i}
                              type="number"
                              value={points[tp.key]?.[i] ?? 0}
                              onChange={(e) => updatePointValue(tp.key, i, e.target.value)}
                              onBlur={() => saveAll()}
                              className="w-14 rounded border border-gray-200 px-1.5 py-1 text-xs text-center text-gray-700 focus:border-teal-400 outline-none"
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => removePointRow(tp.key)}
                          className="text-gray-300 transition-colors hover:text-red-400"
                          title={t("admin.common.remove")}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="mb-1 text-xs text-gray-300">{t("admin.catProf.noUntPoints")}</div>
              )}

              {/* Add a grant type */}
              {UNT_TYPES.some((tp) => !points[tp.key]) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {UNT_TYPES.filter((tp) => !points[tp.key]).map((tp) => (
                    <button
                      key={tp.key}
                      type="button"
                      onClick={() => addPointType(tp.key)}
                      className="rounded border border-dashed border-gray-300 px-2 py-1 text-xs font-medium text-teal-600 transition-colors hover:border-teal-400 hover:text-teal-700"
                    >
                      + {tp.label}
                    </button>
                  ))}
                </div>
              )}
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
                {saving ? t("admin.common.saving") : t("cm.methodic.saveChanges")}
              </button>
            </div>

            <div className="border-t border-gray-100 my-1" />
          </div>
        }
        preview={<UniverProgramPreview prog={prog} uniMap={uniMap} cityMap={cityMap} />}
      />
  );

  return (
    <CatalogDetailScaffold
      breadcrumb={
        <Breadcrumb
          items={[
            { label: t("cm.methodic.heading"), href: "/admin/catalogs" },
            { label: t("cm.methodic.tabs.univerPrograms"), href: "/admin/catalogs#univerPrograms" },
            { label: title || "—" },
          ]}
        />
      }
      title={title}
      catalog="univerPrograms"
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
        value: (prog.params?.output as Record<string, Loc>) ?? {},
        onChange: (next) => {
          const newParams = { ...prog.params, output: next };
          setProg({ ...prog, params: newParams });
        },
        onBlur: saveAll,
      }}
      onDelete={handleDelete}
      deleteLabel={t("admin.catProf.deleteProgram")}
      pages={[{ id: "details", label: t("admin.catProf.untPointsUniversities"), icon: GraduationCap, render: detailsNode }]}
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
// Preview reuses the same components as the public education tab: the UNT
// chart (unt-chart) plus the university cards (program → universities → cities).
function UniverProgramPreview({
  prog,
  uniMap,
  cityMap,
}: {
  prog: UniverProgramRow;
  uniMap: Map<number, UniversityRow>;
  cityMap: Map<number, CityRow>;
}) {
  const { t, locale } = useLocale();
  const loc = locale as "en" | "ru" | "kk";
  const title = prog.name[loc] || prog.name.en || "";
  const points = prog.params?.points ?? {};
  const universities = (prog.params?.universities ?? []).map((entry) => {
    const u = uniMap.get(entry.id);
    const cityRow = u?.city ?? (u?.cityId != null ? cityMap.get(u.cityId) ?? null : null);
    return {
      id: entry.id,
      name: u ? u.name[loc] || u.name.en : t("cm.methodic.deleted"),
      city: cityRow ? cityRow.name[loc] || cityRow.name.en : "",
      type: u?.type === "private" ? "private" : "public",
      grant: entry.grant,
      exists: !!u,
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <div className="text-base font-bold text-gray-900">{title || "—"}</div>
        {prog.code && <div className="mt-0.5 font-mono text-xs text-gray-400">{prog.code}</div>}
        {prog.subjects && (
          <div className="mt-1 text-sm text-gray-500">
            <strong className="text-gray-600">{t("professionDetail.universities.untSubjects")}</strong>{" "}
            {prog.subjects[loc] || prog.subjects.en}
          </div>
        )}
      </div>

      {Object.keys(points).length > 0 && <UntChart points={points} />}

      {universities.length > 0 && (
        <div>
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
            {t("professionDetail.universities.subheading")}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {universities.map((u) => (
              <div key={u.id} className="rounded-xl border border-black/[0.04] bg-white p-4 shadow-sm">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className={"text-sm font-semibold " + (u.exists ? "text-gray-800" : "italic text-red-400")}>
                    {u.name}
                  </span>
                  <span
                    className={
                      "rounded-md px-2 py-0.5 text-xs font-semibold uppercase " +
                      (u.type === "public" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800")
                    }
                  >
                    {u.type === "public"
                      ? t("professionDetail.universities.type.public")
                      : t("professionDetail.universities.type.private")}
                  </span>
                </div>
                {u.city && <div className="mb-1.5 text-xs text-gray-500">{u.city}</div>}
                <span
                  className={
                    "inline-block rounded-md px-2 py-0.5 text-xs font-bold " +
                    (u.grant ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800")
                  }
                >
                  {u.grant
                    ? t("professionDetail.universities.grant.available")
                    : t("professionDetail.universities.grant.none")}
                </span>
              </div>
            ))}
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
