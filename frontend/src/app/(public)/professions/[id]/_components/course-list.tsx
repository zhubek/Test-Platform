"use client";

import { useMemo, useState } from "react";
import { ExternalLink, X, SlidersHorizontal } from "lucide-react";
import type { CourseData } from "../../_components/mock-data";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";

interface Props {
  courses: CourseData[];
  initialSkill?: string;
}

export function CourseList({ courses, initialSkill }: Props) {
  const { t, locale } = useLocale();
  const [platform, setPlatform] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [lang, setLang] = useState<string>("all");
  const [skill, setSkill] = useState<string>(initialSkill ?? "all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Derive unique filter options
  const options = useMemo(() => {
    const platforms = [...new Set(courses.map((c) => c.platform))].sort();
    const levels = [...new Set(courses.map((c) => localize(c.level, locale)))];
    const langs = [...new Set(courses.map((c) => localize(c.lang, locale)))].sort();
    const skills = [...new Set(courses.flatMap((c) => c.skills))].sort();
    return { platforms, levels, langs, skills };
  }, [courses, locale]);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (platform !== "all" && c.platform !== platform) return false;
      if (level !== "all" && localize(c.level, locale) !== level) return false;
      if (lang !== "all" && localize(c.lang, locale) !== lang) return false;
      if (skill !== "all" && !c.skills.includes(skill)) return false;
      return true;
    });
  }, [courses, platform, level, lang, skill, locale]);

  const activeFilters: { label: string; value: string; clear: () => void }[] = [];
  if (platform !== "all")
    activeFilters.push({ label: t("professionDetail.courses.filter.source"), value: platform, clear: () => setPlatform("all") });
  if (level !== "all")
    activeFilters.push({ label: t("professionDetail.courses.filter.level"), value: level, clear: () => setLevel("all") });
  if (lang !== "all")
    activeFilters.push({ label: t("professionDetail.courses.filter.language"), value: lang, clear: () => setLang("all") });
  if (skill !== "all")
    activeFilters.push({ label: t("professionDetail.courses.filter.skill"), value: skill, clear: () => setSkill("all") });

  const hasActiveFilter = activeFilters.length > 0;

  function clearAll() {
    setPlatform("all");
    setLevel("all");
    setLang("all");
    setSkill("all");
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={
            "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all " +
            (filtersOpen
              ? "bg-gray-900 text-white border-gray-900"
              : hasActiveFilter
                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50")
          }
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {t("professionDetail.courses.filters")}
          {hasActiveFilter && !filtersOpen && (
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[0.6rem] flex items-center justify-center font-bold">
              {activeFilters.length}
            </span>
          )}
        </button>

        {/* Active filter pills (shown when panel is closed) */}
        {!filtersOpen && activeFilters.map((f) => (
          <span
            key={f.label}
            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200"
          >
            <span className="text-blue-400">{f.label}:</span> {f.value}
            <button
              onClick={f.clear}
              className="hover:text-blue-900 transition-colors ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {!filtersOpen && hasActiveFilter && (
          <button
            onClick={clearAll}
            className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t("professionDetail.courses.clearAll")}
          </button>
        )}

        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length} {t("common.of")} {courses.length}
        </span>
      </div>

      {/* Collapsible filter panel */}
      <div
        className="accordion-content"
        data-open={filtersOpen}
      >
        <div className="accordion-inner">
          <div className="bg-white border border-black/[0.04] rounded-2xl p-4 shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_4px_14px_-2px_rgb(0_0_0/0.05)] mb-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t("professionDetail.courses.filterHeading")}
              </span>
              {hasActiveFilter && (
                <button
                  onClick={clearAll}
                  className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  {t("professionDetail.courses.clearAll")}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <FilterSelect
                label={t("professionDetail.courses.filter.source")}
                value={platform}
                onChange={setPlatform}
                options={options.platforms}
                allLabel={t("professionDetail.courses.all")}
              />
              <FilterSelect
                label={t("professionDetail.courses.filter.level")}
                value={level}
                onChange={setLevel}
                options={options.levels}
                allLabel={t("professionDetail.courses.all")}
              />
              <FilterSelect
                label={t("professionDetail.courses.filter.language")}
                value={lang}
                onChange={setLang}
                options={options.langs}
                allLabel={t("professionDetail.courses.all")}
              />
              <FilterSelect
                label={t("professionDetail.courses.filter.skill")}
                value={skill}
                onChange={setSkill}
                options={options.skills}
                allLabel={t("professionDetail.courses.all")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Course cards */}
      <div className="space-y-3">
        {filtered.map((c, i) => (
          <div
            key={localize(c.name, locale)}
            className="bg-white border border-black/[0.04] rounded-xl p-4 sm:p-5 shadow-[0_1px_2px_0_rgb(0_0_0/0.03),0_2px_8px_-2px_rgb(0_0_0/0.04)] hover-lift animate-stagger-fade-up"
            style={{ "--stagger-index": i } as React.CSSProperties}
          >
            {/* Title + price row */}
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="text-sm font-semibold text-gray-800">
                {localize(c.name, locale)}
              </div>
              <span className="text-sm font-bold text-gray-900 shrink-0">
                {localize(c.price, locale)}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-3.5 gap-y-1 mb-2">
              <span className="text-xs text-gray-500">
                <strong className="text-gray-600">{t("professionDetail.courses.instructor")}</strong>{" "}
                {c.instructor}
              </span>
              <span className="text-xs text-gray-500">
                <strong className="text-gray-600">{t("professionDetail.courses.duration")}</strong>{" "}
                {localize(c.duration, locale)}
              </span>
            </div>

            {/* Meta badges */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                {c.platform}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-violet-100 text-violet-800">
                {localize(c.level, locale)}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                {localize(c.lang, locale)}
              </span>
            </div>

            {/* Skills + Open button row */}
            <div className="flex items-end justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {c.skills.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSkill(s === skill ? "all" : s)}
                    className={
                      "text-[0.6875rem] font-semibold px-2 py-0.5 rounded-md transition-colors cursor-pointer " +
                      (s === skill
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100")
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-gray-700 px-2.5 py-1 border border-gray-200 rounded-lg transition-all hover:bg-gray-900 hover:text-white hover:border-gray-900 hover:shadow-sm"
              >
                {t("professionDetail.courses.open")}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-10">
          <div className="text-sm text-gray-400 mb-2">
            {t("professionDetail.courses.empty")}
          </div>
          <button
            onClick={clearAll}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            {t("professionDetail.courses.clearFilters")}
          </button>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = "All",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  allLabel?: string;
}) {
  return (
    <div>
      <label className="text-[0.625rem] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          "w-full text-xs font-medium rounded-lg border px-2.5 py-1.5 transition-colors cursor-pointer " +
          (value !== "all"
            ? "border-blue-200 bg-blue-50/50 text-blue-800"
            : "border-gray-200 bg-white text-gray-700")
        }
      >
        <option value="all">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
