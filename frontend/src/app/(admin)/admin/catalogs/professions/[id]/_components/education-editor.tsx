"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocale } from "@/lib/locale-context";
import { useContentLocale } from "../../../_components/edit-language";
import { EditorLayout } from "../../../_components/editor-layout";
import { localize } from "@/lib/localized";
import {
  fetchUniverPrograms,
  fetchCollegePrograms,
  fetchUniversities,
  fetchColleges,
  fetchCities,
  type UniverProgramRow,
  type CollegeProgramRow,
  type UniversityRow,
  type CollegeRow,
  type CityRow,
} from "@/lib/methodic-api";
import { EducationTab, type SubTab } from "@/app/professions/[id]/_components/education-tab";
import type {
  EducationData,
  SpecializationData,
  CollegeSpecData,
  UniversityData,
  CollegeData,
} from "@/app/professions/_components/mock-data";

interface EducationParams {
  specializations?: number[];
  collegeSpecs?: number[];
}

interface Props {
  data: EducationParams | null;
  onSave?: (data: EducationParams) => void;
}

const emptyLoc = { en: "", ru: "", kk: "" };

export function EducationEditor({ data: initial, onSave }: Props) {
  const { t } = useLocale();
  const loc = useContentLocale();

  // Reference data: education → university programs → universities → cities
  // (and college programs → colleges → cities).
  const [allUniProgs, setAllUniProgs] = useState<UniverProgramRow[]>([]);
  const [allColProgs, setAllColProgs] = useState<CollegeProgramRow[]>([]);
  const [allUnis, setAllUnis] = useState<UniversityRow[]>([]);
  const [allCols, setAllCols] = useState<CollegeRow[]>([]);
  const [allCities, setAllCities] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [specIds, setSpecIds] = useState<number[]>(initial?.specializations ?? []);
  const [colSpecIds, setColSpecIds] = useState<number[]>(initial?.collegeSpecs ?? []);
  const [sub, setSub] = useState<SubTab>("universities");

  useEffect(() => {
    Promise.all([
      fetchUniverPrograms(),
      fetchCollegePrograms(),
      fetchUniversities(),
      fetchColleges(),
      fetchCities(),
    ])
      .then(([up, cp, u, c, ci]) => {
        setAllUniProgs(up);
        setAllColProgs(cp);
        setAllUnis(u);
        setAllCols(c);
        setAllCities(ci);
      })
      .catch((err) => console.error("Failed to load programs:", err))
      .finally(() => setLoading(false));
  }, []);

  const uniProgMap = useMemo(() => {
    const m = new Map<number, UniverProgramRow>();
    allUniProgs.forEach((p) => m.set(p.id, p));
    return m;
  }, [allUniProgs]);
  const colProgMap = useMemo(() => {
    const m = new Map<number, CollegeProgramRow>();
    allColProgs.forEach((p) => m.set(p.id, p));
    return m;
  }, [allColProgs]);
  const uniMap = useMemo(() => {
    const m = new Map<number, UniversityRow>();
    allUnis.forEach((u) => m.set(u.id, u));
    return m;
  }, [allUnis]);
  const colMap = useMemo(() => {
    const m = new Map<number, CollegeRow>();
    allCols.forEach((c) => m.set(c.id, c));
    return m;
  }, [allCols]);
  const cityMap = useMemo(() => {
    const m = new Map<number, CityRow>();
    allCities.forEach((c) => m.set(c.id, c));
    return m;
  }, [allCities]);

  const availableUniProgs = useMemo(() => {
    const selected = new Set(specIds);
    return allUniProgs.filter((p) => !selected.has(p.id));
  }, [allUniProgs, specIds]);

  const availableColProgs = useMemo(() => {
    const selected = new Set(colSpecIds);
    return allColProgs.filter((p) => !selected.has(p.id));
  }, [allColProgs, colSpecIds]);

  function addSpec(id: number) { setSpecIds((prev) => [...prev, id]); }
  function removeSpec(id: number) { setSpecIds((prev) => prev.filter((i) => i !== id)); }
  function addColSpec(id: number) { setColSpecIds((prev) => [...prev, id]); }
  function removeColSpec(id: number) { setColSpecIds((prev) => prev.filter((i) => i !== id)); }

  // Resolve a university-program id into the public SpecializationData shape:
  // program → universities → cities, plus the program's UNT points.
  function resolveSpec(id: number): SpecializationData | null {
    const prog = uniProgMap.get(id);
    if (!prog) return null;
    const universities: UniversityData[] = (prog.params?.universities ?? []).map((entry) => {
      const uni = uniMap.get(entry.id);
      const cityRow = uni?.city ?? (uni?.cityId != null ? cityMap.get(uni.cityId) ?? null : null);
      return {
        id: String(entry.id),
        name: uni ? localize(uni.name, loc) : "—",
        city: cityRow ? localize(cityRow.name, loc) : "",
        type: uni?.type === "private" ? "private" : "public",
        grant: entry.grant,
      };
    });
    return {
      id: String(prog.id),
      title: prog.name,
      code: prog.code ?? "",
      subjects: prog.subjects ?? emptyLoc,
      points: prog.params?.points,
      universities,
    };
  }

  // Resolve a college-program id: program → colleges → cities.
  function resolveColSpec(id: number): CollegeSpecData | null {
    const prog = colProgMap.get(id);
    if (!prog) return null;
    const colleges: CollegeData[] = (prog.params?.colleges ?? []).map((entry) => {
      const col = colMap.get(entry.id);
      const cityRow = col?.city ?? (col?.cityId != null ? cityMap.get(col.cityId) ?? null : null);
      return {
        id: String(entry.id),
        name: col ? localize(col.name, loc) : "—",
        city: cityRow ? localize(cityRow.name, loc) : "",
        duration: entry.duration ?? emptyLoc,
      };
    });
    return {
      id: String(prog.id),
      title: prog.name,
      code: prog.code ?? "",
      colleges,
    };
  }

  const liveData: EducationData = {
    specializations: specIds.map(resolveSpec).filter((s): s is SpecializationData => s !== null),
    collegeSpecs: colSpecIds.map(resolveColSpec).filter((s): s is CollegeSpecData => s !== null),
    courses: [],
  };

  if (loading) {
    return <div className="text-center py-10 text-sm text-gray-400">Loading...</div>;
  }

  return (
    <EditorLayout
      editor={
        <>
          {/* University Programs */}
          <SectionHeader label={t("professionDetail.education.universities")} />
          {specIds.map((id) => {
            const prog = uniProgMap.get(id);
            return (
              <div key={id} className="mb-3 bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {prog ? (
                      <>
                        <div className="text-sm font-medium text-gray-900">
                          {prog.name[loc] || prog.name.en}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{prog.code}</div>
                        {prog.subjects && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {prog.subjects[loc] || prog.subjects.en}
                          </div>
                        )}
                        <div className="text-[0.68rem] text-gray-400 mt-1">
                          {prog.params?.universities?.length ?? 0} {t("cm.methodic.profession.universities")}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-red-400 italic">{t("cm.methodic.deleted")} (ID: {id})</div>
                    )}
                  </div>
                  <RemoveButton onClick={() => removeSpec(id)} />
                </div>
              </div>
            );
          })}
          <ProgramPicker
            programs={availableUniProgs.map((p) => ({ id: p.id, title: p.name[loc] || p.name.en, code: p.code ?? "" }))}
            onSelect={(id) => addSpec(id)}
            placeholder={t("cm.methodic.profession.selectProgram")}
          />

          {/* College Programs */}
          <SectionHeader label={t("professionDetail.education.colleges")} />
          {colSpecIds.map((id) => {
            const prog = colProgMap.get(id);
            return (
              <div key={id} className="mb-3 bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {prog ? (
                      <>
                        <div className="text-sm font-medium text-gray-900">
                          {prog.name[loc] || prog.name.en}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{prog.code}</div>
                        <div className="text-[0.68rem] text-gray-400 mt-1">
                          {prog.params?.colleges?.length ?? 0} {t("cm.methodic.profession.colleges")}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-red-400 italic">{t("cm.methodic.deleted")} (ID: {id})</div>
                    )}
                  </div>
                  <RemoveButton onClick={() => removeColSpec(id)} />
                </div>
              </div>
            );
          })}
          <ProgramPicker
            programs={availableColProgs.map((p) => ({ id: p.id, title: p.name[loc] || p.name.en, code: p.code ?? "" }))}
            onSelect={(id) => addColSpec(id)}
            placeholder={t("cm.methodic.profession.selectCollegeProgram")}
          />

          {/* Save */}
          {onSave && (
            <button
              type="button"
              onClick={() => onSave({ specializations: specIds, collegeSpecs: colSpecIds })}
              className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
            >
              {t("cm.methodic.saveChanges")}
            </button>
          )}
        </>
      }
      preview={<EducationTab data={liveData} activeSub={sub} onSubChange={setSub} />}
    />
  );
}

function ProgramPicker({
  programs,
  onSelect,
  placeholder,
}: {
  programs: { id: number; title: string; code: string }[];
  onSelect: (id: number) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = programs.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
  });

  return (
    <div className="mb-4 relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
      >
        + {placeholder}
      </button>
      {open && (
        <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 relative max-h-60 overflow-auto">
          <div className="sticky top-0 bg-white border-b border-gray-100 p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="..."
              className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-900 outline-none focus:border-teal-400"
              autoFocus
            />
          </div>
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onSelect(p.id); setOpen(false); setSearch(""); }}
              className="w-full text-left px-3 py-2 hover:bg-teal-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <div className="text-sm font-medium text-gray-900">{p.title}</div>
              <div className="text-xs text-gray-400 font-mono">{p.code}</div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-xs text-gray-400 text-center">—</div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 mt-2">
      {label}
    </div>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 self-start mt-2 text-gray-300 hover:text-red-400 transition-colors"
      title="Remove"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
      </svg>
    </button>
  );
}
