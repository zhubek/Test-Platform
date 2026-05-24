"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import type { LaborMarketData } from "../../_components/mock-data";
import { SalaryChart } from "./salary-chart";
import { useLocale } from "@/lib/locale-context";
import type { Localized } from "@/lib/localized";
import { localize } from "@/lib/localized";

const badgeColors: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-800",
  blue: "bg-blue-100 text-blue-800",
  amber: "bg-amber-100 text-amber-800",
};

const accentColors: Record<string, string> = {
  green: "border-l-emerald-600",
  blue: "border-l-blue-600",
  amber: "border-l-amber-500",
  purple: "border-l-violet-600",
};

const DEMAND_LEVELS: Record<string, number> = {
  Low: 1,
  Moderate: 3,
  High: 4,
  "Very High": 5,
};

interface Props {
  data: LaborMarketData;
}

export function LaborMarketTab({ data }: Props) {
  const { t, locale } = useLocale();

  return (
    <div className="space-y-7">
      {/* Market Overview -- Dashboard Mosaic */}
      <Section title={t("professionDetail.labor.overview")} subtitle={t("professionDetail.labor.overview.sub")}>
        <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr] gap-3">
          {/* Demand + Industries -- left card */}
          <DemandCard data={data.overview.demand} industries={data.industries} />

          {/* Right column: growth + openings stacked */}
          <div className="flex flex-col gap-3">
            <GrowthCard data={data.overview.growth} />
            <OpeningsCard data={data.overview.openings} />
          </div>
        </div>
      </Section>

      {/* Salary */}
      <Section title={t("professionDetail.labor.salary")} subtitle={t("professionDetail.labor.salary.sub")}>
        <SalaryChart cards={data.salary.cards} note={data.salary.note} />
      </Section>

      {/* Job Strategy */}
      <Section title={t("professionDetail.labor.strategy")} subtitle={t("professionDetail.labor.strategy.sub")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <StrategyCard title={t("professionDetail.labor.applicationStrategy")} items={data.strategy.application} dotColor="bg-indigo-300" />
          <StrategyCard title={t("professionDetail.labor.careerDev")} items={data.strategy.careerDev} dotColor="bg-emerald-300" />
        </div>
      </Section>

      {/* Market Analytics */}
      <Section title={t("professionDetail.labor.analytics")} subtitle={t("professionDetail.labor.analytics.sub")}>
        <div className="space-y-2.5">
          {data.insights.map((ins, i) => (
            <div
              key={i}
              className={
                "bg-white border border-black/[0.04] rounded-xl p-4 text-sm text-gray-600 leading-relaxed border-l-[3px] shadow-[0_1px_2px_0_rgb(0_0_0/0.03)] animate-stagger-fade-up " +
                accentColors[ins.accent]
              }
              style={{ "--stagger-index": i } as React.CSSProperties}
            >
              {localize(ins.text, locale)}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-base font-bold text-gray-900 mb-0.5">
        {title}
      </div>
      <div className="text-[0.8125rem] text-gray-400 mb-4">{subtitle}</div>
      {children}
    </div>
  );
}

function DemandCard({
  data,
  industries,
}: {
  data: { label: Localized; value: Localized; badge: Localized; badgeColor: string; demandLevel?: number };
  industries: Localized[];
}) {
  const { t, locale } = useLocale();
  const level = data.demandLevel ?? DEMAND_LEVELS[data.value.en] ?? 3;
  const dots = 5;

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-6 relative overflow-hidden shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_4px_14px_-2px_rgb(0_0_0/0.05)] hover-lift animate-stagger-fade-up flex flex-col gap-4">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 to-blue-400" />

      {/* Demand header */}
      <div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          {localize(data.label, locale)}
        </div>
        <div className="text-xl font-extrabold text-gray-900">
          {localize(data.value, locale)}
        </div>
      </div>

      {/* Dot gauge */}
      <div className="flex gap-1.5">
        {Array.from({ length: dots }).map((_, i) => (
          <div
            key={i}
            className={
              "w-2.5 h-2.5 rounded-full transition-all " +
              (i < level
                ? "bg-blue-500 shadow-[0_0_6px_rgb(59_130_246/0.4)]"
                : "bg-gray-200")
            }
          />
        ))}
      </div>

      {/* Industries */}
      <div>
        <div className="text-[0.6875rem] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {t("professionDetail.labor.keyIndustries")}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {industries.map((ind, i) => (
            <span
              key={localize(ind, locale)}
              className="bg-blue-50/60 border border-blue-100/60 rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-800 animate-scale-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {localize(ind, locale)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function GrowthCard({
  data,
}: {
  data: {
    label: Localized;
    value: string;
    desc: Localized;
    badge: Localized;
    badgeColor: string;
  };
}) {
  const { locale } = useLocale();
  const isNegative = data.value.startsWith("-");
  const TrendIcon = isNegative ? TrendingDown : TrendingUp;

  return (
    <div
      className="bg-white border border-black/[0.04] rounded-2xl p-5 relative overflow-hidden shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_4px_14px_-2px_rgb(0_0_0/0.05)] hover-lift animate-stagger-fade-up flex-1"
      style={{ "--stagger-index": 1 } as React.CSSProperties}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-600 to-emerald-400" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            {localize(data.label, locale)}
          </div>
          <div className="text-xs text-gray-500">{localize(data.desc, locale)}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <TrendIcon
            className={
              "w-5 h-5 " +
              (isNegative ? "text-red-500" : "text-emerald-500")
            }
          />
          <span className="text-xl font-extrabold text-gray-900">
            {data.value}
          </span>
        </div>
      </div>

      <div className="mt-2.5">
        <span
          className={
            "text-[0.6875rem] font-bold px-2 py-0.5 rounded-md inline-block " +
            badgeColors[data.badgeColor]
          }
        >
          {localize(data.badge, locale)}
        </span>
      </div>
    </div>
  );
}

function OpeningsCard({
  data,
}: {
  data: { label: Localized; value: string; desc: Localized; updated: Localized };
}) {
  const { locale } = useLocale();
  return (
    <div
      className="bg-white border border-black/[0.04] rounded-2xl p-5 relative overflow-hidden shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_4px_14px_-2px_rgb(0_0_0/0.05)] hover-lift animate-stagger-fade-up flex-1"
      style={{ "--stagger-index": 2 } as React.CSSProperties}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-amber-300" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            {localize(data.label, locale)}
          </div>
          <div className="text-xs text-gray-500">{localize(data.desc, locale)}</div>
        </div>
        <div className="text-xl font-extrabold text-gray-900 shrink-0">
          {data.value}
        </div>
      </div>

      <div className="text-[0.6875rem] text-gray-400 mt-2.5">
        {localize(data.updated, locale)}
      </div>
    </div>
  );
}

function StrategyCard({
  title,
  items,
  dotColor,
}: {
  title: string;
  items: Localized[];
  dotColor: string;
}) {
  const { locale } = useLocale();
  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-5 shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_4px_14px_-2px_rgb(0_0_0/0.05)]">
      <div className="text-sm font-bold text-gray-900 mb-3">
        {title}
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="text-[0.8125rem] text-gray-600 leading-relaxed pl-4 relative"
          >
            <span
              className={`absolute left-0 top-[7px] w-1.5 h-1.5 rounded-full ${dotColor}`}
            />
            {localize(item, locale)}
          </li>
        ))}
      </ul>
    </div>
  );
}
