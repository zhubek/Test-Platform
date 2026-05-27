"use client";

import { useState, useCallback } from "react";
import { useLocale } from "@/lib/locale-context";
import { LocalizedInput } from "../../../_components/localized-input";
import { LocalizedTextarea } from "../../../_components/localized-textarea";
import { EditorLayout } from "../../../_components/editor-layout";
import { LaborMarketTab } from "@/app/professions/[id]/_components/labor-market-tab";
import type { LaborMarketData } from "@/app/professions/_components/mock-data";
import { l } from "@/lib/localized";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

const textareaClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none";

const emptyData: LaborMarketData = {
  overview: {
    demand: {
      label: l("Market Demand", "Спрос на рынке"),
      value: l("", ""),
      badge: l("", ""),
      badgeColor: "blue",
      demandLevel: 3,
    },
    growth: {
      label: l("Job Growth", "Рост вакансий"),
      value: "",
      desc: l("", ""),
      badge: l("", ""),
      badgeColor: "green",
    },
    openings: {
      label: l("Annual Openings", "Годовые вакансии"),
      value: "",
      desc: l("", ""),
      updated: l("", ""),
    },
  },
  salary: { cards: [], note: l("", "") },
  industries: [],
  geoCenters: [],
  strategy: { application: [], careerDev: [] },
  insights: [],
};

function formatSalary(n: number): string {
  if (n >= 1_000_000) return `₸${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)}M`;
  if (n >= 1000) return `₸${Math.round(n / 1000).toLocaleString()}K`;
  return `₸${n.toLocaleString()}`;
}

function formatSalaryFull(n: number): string {
  return `₸${n.toLocaleString()}`;
}

interface Props {
  data: LaborMarketData | null;
}

export function LaborMarketEditor({ data: initial }: Props) {
  const { t } = useLocale();
  const src = initial ?? emptyData;

  // Overview
  const [demandValue, setDemandValue] = useState({ ...src.overview.demand.value });
  const [demandBadge, setDemandBadge] = useState({ ...src.overview.demand.badge });
  const [demandLevel, setDemandLevel] = useState(src.overview.demand.demandLevel ?? 3);
  const [growthValue, setGrowthValue] = useState(src.overview.growth.value);
  const [growthDesc, setGrowthDesc] = useState({ ...src.overview.growth.desc });
  const [growthBadge, setGrowthBadge] = useState({ ...src.overview.growth.badge });
  const [openingsValue, setOpeningsValue] = useState(src.overview.openings.value);
  const [openingsDesc, setOpeningsDesc] = useState({ ...src.overview.openings.desc });
  const [openingsUpdated, setOpeningsUpdated] = useState({ ...src.overview.openings.updated });

  // Industries (moved up)
  const [industries, setIndustries] = useState(
    src.industries.map((ind) => ({ ...ind }))
  );

  // Salary
  const [salaryNote, setSalaryNote] = useState({ ...src.salary.note });
  const [salaryCards, setSalaryCards] = useState(
    src.salary.cards.map((c) => ({
      ...c,
      level: { ...c.level },
      experience: { ...c.experience },
    }))
  );

  // Strategy
  const [application, setApplication] = useState(
    src.strategy.application.map((a) => ({ ...a }))
  );
  const [careerDev, setCareerDev] = useState(
    src.strategy.careerDev.map((c) => ({ ...c }))
  );

  // Insights
  const [insights, setInsights] = useState(
    src.insights.map((ins) => ({ text: { ...ins.text }, accent: ins.accent }))
  );

  const updateSalaryCard = useCallback(
    (ci: number, patch: Record<string, unknown>) =>
      setSalaryCards((prev) =>
        prev.map((c, i) => (i === ci ? { ...c, ...patch } : c))
      ),
    []
  );

  const liveData: LaborMarketData = {
    overview: {
      demand: { ...src.overview.demand, value: demandValue, badge: demandBadge, demandLevel },
      growth: {
        ...src.overview.growth,
        value: growthValue,
        desc: growthDesc,
        badge: growthBadge,
      },
      openings: {
        ...src.overview.openings,
        value: openingsValue,
        desc: openingsDesc,
        updated: openingsUpdated,
      },
    },
    salary: { cards: salaryCards, note: salaryNote },
    industries,
    geoCenters: src.geoCenters,
    strategy: { application, careerDev },
    insights,
  };

  return (
    <EditorLayout
      editor={
        <>
          {/* Market Overview */}
          <SectionHeader label={t("professionDetail.labor.overview")} />

          <FieldGroup label={t("cm.methodic.profession.labor.demand")}>
            <LocalizedInput value={demandValue} onChange={setDemandValue} className={inputClass} />
            <div className="mt-1.5">
              <LocalizedInput
                value={demandBadge}
                onChange={setDemandBadge}
                placeholder={t("cm.methodic.profession.labor.badge")}
                className={inputClass}
              />
            </div>
          </FieldGroup>

          {/* Demand Level dots picker */}
          <FieldGroup label={t("cm.methodic.profession.labor.demandLevel")}>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDemandLevel(n)}
                  className={
                    "w-7 h-7 rounded-full text-xs font-bold transition-all " +
                    (n <= demandLevel
                      ? "bg-blue-500 text-white shadow-[0_0_8px_rgb(59_130_246/0.4)]"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200")
                  }
                >
                  {n}
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={5}
                value={demandLevel}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(5, Number(e.target.value) || 1));
                  setDemandLevel(v);
                }}
                className="ml-1 w-12 rounded-lg border border-gray-200 px-2 py-1 text-sm text-center text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              />
              <span className="text-xs text-gray-400">/ 5</span>
            </div>
          </FieldGroup>

          {/* Key Industries (moved up, right after demand) */}
          <FieldGroup label={t("professionDetail.labor.keyIndustries")}>
            {industries.map((ind, i) => (
              <div key={i} className="mb-2 flex gap-1.5">
                <div className="flex-1">
                  <LocalizedInput
                    value={ind}
                    onChange={(v) =>
                      setIndustries((prev) =>
                        prev.map((item, idx) => (idx === i ? v : item))
                      )
                    }
                    className={inputClass}
                  />
                </div>
                <RemoveButton
                  onClick={() =>
                    setIndustries((prev) => prev.filter((_, idx) => idx !== i))
                  }
                />
              </div>
            ))}
            <AddButton
              label={t("common.add")}
              onClick={() => setIndustries((prev) => [...prev, l("", "")])}
            />
          </FieldGroup>

          <FieldGroup label={t("cm.methodic.profession.labor.growth")}>
            <input
              type="text"
              value={growthValue}
              onChange={(e) => setGrowthValue(e.target.value)}
              placeholder="e.g. 9%+"
              className={inputClass}
            />
            <div className="mt-1.5">
              <LocalizedInput value={growthDesc} onChange={setGrowthDesc} className={inputClass} />
            </div>
            <div className="mt-1.5">
              <LocalizedInput
                value={growthBadge}
                onChange={setGrowthBadge}
                placeholder={t("cm.methodic.profession.labor.badge")}
                className={inputClass}
              />
            </div>
          </FieldGroup>

          <FieldGroup label={t("cm.methodic.profession.labor.openings")}>
            <input
              type="text"
              value={openingsValue}
              onChange={(e) => setOpeningsValue(e.target.value)}
              placeholder="e.g. 5,360"
              className={inputClass}
            />
            <div className="mt-1.5">
              <LocalizedInput value={openingsDesc} onChange={setOpeningsDesc} className={inputClass} />
            </div>
            <div className="mt-1.5">
              <LocalizedInput value={openingsUpdated} onChange={setOpeningsUpdated} placeholder="Updated: ..." className={inputClass} />
            </div>
          </FieldGroup>

          {/* Salary */}
          <SectionHeader label={t("professionDetail.labor.salary")} />
          {salaryCards.map((card, ci) => (
            <div
              key={ci}
              className="mb-4 bg-white rounded-xl border border-gray-100 p-4 space-y-3"
            >
              {/* Level + remove */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <LocalizedInput
                    value={card.level}
                    onChange={(v) => updateSalaryCard(ci, { level: v })}
                    placeholder={t("cm.methodic.profession.labor.level")}
                    className={inputClass}
                  />
                </div>
                <RemoveButton
                  onClick={() =>
                    setSalaryCards((prev) => prev.filter((_, i) => i !== ci))
                  }
                />
              </div>

              {/* Salary range slider */}
              <SalaryRangeSlider
                rangeMin={card.rangeMin}
                rangeMax={card.rangeMax}
                mainNum={card.mainNum}
                onChange={(min, max, main) =>
                  updateSalaryCard(ci, {
                    rangeMin: min,
                    rangeMax: max,
                    mainNum: main,
                    main: formatSalaryFull(main),
                    range: `${formatSalaryFull(min)} – ${formatSalaryFull(max)}`,
                  })
                }
              />

              {/* Experience (full width) */}
              <LocalizedInput
                value={card.experience}
                onChange={(v) => updateSalaryCard(ci, { experience: v })}
                placeholder={t("cm.methodic.profession.labor.experience")}
                className={inputClass}
              />

            </div>
          ))}
          <AddButton
            label={t("common.add")}
            onClick={() =>
              setSalaryCards((prev) => [
                ...prev,
                {
                  level: l("", ""),
                  main: "₸0",
                  mainNum: 0,
                  range: "₸0 – ₸0",
                  rangeMin: 0,
                  rangeMax: 500000,
                  experience: l("", ""),
                },
              ])
            }
          />

          <FieldGroup label={t("cm.methodic.profession.labor.salaryNote")}>
            <LocalizedTextarea value={salaryNote} onChange={setSalaryNote} className={textareaClass} rows={2} />
          </FieldGroup>

          {/* Strategy */}
          <SectionHeader label={t("professionDetail.labor.applicationStrategy")} />
          {application.map((a, i) => (
            <div key={i} className="mb-2 flex gap-1.5">
              <div className="flex-1">
                <LocalizedTextarea
                  value={a}
                  onChange={(v) =>
                    setApplication((prev) =>
                      prev.map((item, idx) => (idx === i ? v : item))
                    )
                  }
                  className={textareaClass}
                  rows={2}
                />
              </div>
              <RemoveButton
                onClick={() =>
                  setApplication((prev) => prev.filter((_, idx) => idx !== i))
                }
              />
            </div>
          ))}
          <AddButton
            label={t("common.add")}
            onClick={() => setApplication((prev) => [...prev, l("", "")])}
          />

          <SectionHeader label={t("professionDetail.labor.careerDev")} />
          {careerDev.map((c, i) => (
            <div key={i} className="mb-2 flex gap-1.5">
              <div className="flex-1">
                <LocalizedTextarea
                  value={c}
                  onChange={(v) =>
                    setCareerDev((prev) =>
                      prev.map((item, idx) => (idx === i ? v : item))
                    )
                  }
                  className={textareaClass}
                  rows={2}
                />
              </div>
              <RemoveButton
                onClick={() =>
                  setCareerDev((prev) => prev.filter((_, idx) => idx !== i))
                }
              />
            </div>
          ))}
          <AddButton
            label={t("common.add")}
            onClick={() => setCareerDev((prev) => [...prev, l("", "")])}
          />

          {/* Insights */}
          <SectionHeader label={t("professionDetail.labor.analytics")} />
          {insights.map((ins, i) => (
            <div key={i} className="mb-3 bg-white rounded-xl border border-gray-100 p-3 space-y-2">
              <div className="flex gap-1.5">
                <div className="flex-1">
                  <LocalizedTextarea
                    value={ins.text}
                    onChange={(v) =>
                      setInsights((prev) =>
                        prev.map((item, idx) =>
                          idx === i ? { ...item, text: v } : item
                        )
                      )
                    }
                    className={textareaClass}
                    rows={2}
                  />
                </div>
                <RemoveButton
                  onClick={() =>
                    setInsights((prev) => prev.filter((_, idx) => idx !== i))
                  }
                />
              </div>
              <select
                value={ins.accent}
                onChange={(e) =>
                  setInsights((prev) =>
                    prev.map((item, idx) =>
                      idx === i ? { ...item, accent: e.target.value } : item
                    )
                  )
                }
                className={inputClass + " cursor-pointer"}
              >
                <option value="green">Green</option>
                <option value="blue">Blue</option>
                <option value="amber">Amber</option>
                <option value="purple">Purple</option>
              </select>
            </div>
          ))}
          <AddButton
            label={t("common.add")}
            onClick={() =>
              setInsights((prev) => [
                ...prev,
                { text: l("", ""), accent: "blue" },
              ])
            }
          />
        </>
      }
      preview={<LaborMarketTab data={liveData} />}
    />
  );
}

/* ── Salary Range Slider ──────────────────────────────────────── */

const SALARY_STEP = 25000;
const SALARY_MAX = 2000000;
const numInputClass =
  "w-full rounded-md border border-gray-200 px-2 py-1 text-xs font-mono text-gray-900 text-center focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

function SalaryRangeSlider({
  rangeMin,
  rangeMax,
  mainNum,
  onChange,
}: {
  rangeMin: number;
  rangeMax: number;
  mainNum: number;
  onChange: (min: number, max: number, main: number) => void;
}) {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const snap = (v: number) => Math.round(v / SALARY_STEP) * SALARY_STEP;

  const handleMinChange = (val: number) => {
    const v = snap(clamp(val, 0, rangeMax - SALARY_STEP));
    const newMain = clamp(mainNum, v, rangeMax);
    onChange(v, rangeMax, newMain);
  };

  const handleMaxChange = (val: number) => {
    const v = snap(clamp(val, rangeMin + SALARY_STEP, SALARY_MAX));
    const newMain = clamp(mainNum, rangeMin, v);
    onChange(rangeMin, v, newMain);
  };

  const handleMainChange = (val: number) => {
    const v = snap(clamp(val, rangeMin, rangeMax));
    onChange(rangeMin, rangeMax, v);
  };

  const leftPct = (rangeMin / SALARY_MAX) * 100;
  const rightPct = (rangeMax / SALARY_MAX) * 100;
  const mainPct = (mainNum / SALARY_MAX) * 100;

  return (
    <div className="space-y-2">
      {/* Visual bar */}
      <div className="relative h-3 bg-gray-100 rounded-full">
        {/* Filled range */}
        <div
          className="absolute top-0 h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
          style={{ left: `${leftPct}%`, width: `${rightPct - leftPct}%` }}
        />
        {/* Main marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white bg-gray-900 z-10"
          style={{ left: `${mainPct}%`, marginLeft: "-7px" }}
        />
      </div>

      {/* Sliders + number inputs */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[0.6rem] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Min</label>
          <input
            type="number"
            min={0}
            max={SALARY_MAX}
            step={SALARY_STEP}
            value={rangeMin}
            onChange={(e) => handleMinChange(Number(e.target.value) || 0)}
            className={numInputClass}
          />
          <input
            type="range"
            min={0}
            max={SALARY_MAX}
            step={SALARY_STEP}
            value={rangeMin}
            onChange={(e) => handleMinChange(Number(e.target.value))}
            className="w-full accent-blue-500 h-1.5 mt-1"
          />
        </div>
        <div>
          <label className="block text-[0.6rem] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Median</label>
          <input
            type="number"
            min={0}
            max={SALARY_MAX}
            step={SALARY_STEP}
            value={mainNum}
            onChange={(e) => handleMainChange(Number(e.target.value) || 0)}
            className={numInputClass}
          />
          <input
            type="range"
            min={0}
            max={SALARY_MAX}
            step={SALARY_STEP}
            value={mainNum}
            onChange={(e) => handleMainChange(Number(e.target.value))}
            className="w-full accent-gray-900 h-1.5 mt-1"
          />
        </div>
        <div>
          <label className="block text-[0.6rem] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Max</label>
          <input
            type="number"
            min={0}
            max={SALARY_MAX}
            step={SALARY_STEP}
            value={rangeMax}
            onChange={(e) => handleMaxChange(Number(e.target.value) || 0)}
            className={numInputClass}
          />
          <input
            type="range"
            min={0}
            max={SALARY_MAX}
            step={SALARY_STEP}
            value={rangeMax}
            onChange={(e) => handleMaxChange(Number(e.target.value))}
            className="w-full accent-blue-500 h-1.5 mt-1"
          />
        </div>
      </div>
    </div>
  );
}

/* ── Shared primitives ────────────────────────────────────────── */

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 mt-2">
      {label}
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="block text-[0.72rem] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
    >
      + {label}
    </button>
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
