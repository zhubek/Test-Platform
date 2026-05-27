"use client";

import { useMemo } from "react";
import type { SalaryCard } from "../../_components/mock-data";
import { useLocale } from "@/lib/locale-context";
import type { Localized } from "@/lib/localized";
import { localize } from "@/lib/localized";

const LEVEL_COLORS = [
  { from: "#3b82f6", to: "#60a5fa" },
  { from: "#8b5cf6", to: "#a78bfa" },
  { from: "#10b981", to: "#34d399" },
];

function formatShort(n: number): string {
  if (n >= 1000000) return `₸${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 2)}M`;
  if (n >= 1000) return `₸${Math.round(n / 1000)}K`;
  return `₸${n}`;
}

interface Props {
  cards: SalaryCard[];
  note: Localized;
}

export function SalaryChart({ cards, note }: Props) {
  const { locale } = useLocale();
  const { globalMin, globalMax } = useMemo(() => {
    const mins = cards.map((c) => c.rangeMin);
    const maxs = cards.map((c) => c.rangeMax);
    return {
      globalMin: Math.min(...mins),
      globalMax: Math.max(...maxs),
    };
  }, [cards]);

  const globalRange = globalMax - globalMin || 1;

  // Build scale ticks
  const ticks = useMemo(() => {
    const niceSteps = [50000, 100000, 150000, 200000, 250000, 500000];
    const rawStep = globalRange / 4;
    const step = niceSteps.find((s) => s >= rawStep) ?? 250000;
    const start = Math.ceil(globalMin / step) * step;
    const result: number[] = [];
    for (let v = start; v <= globalMax; v += step) {
      result.push(v);
    }
    const minGap = globalRange * 0.06;
    if (result.length === 0 || result[0] - globalMin > minGap) {
      result.unshift(globalMin);
    }
    if (result[result.length - 1] < globalMax - minGap) {
      result.push(globalMax);
    }
    return result;
  }, [globalMin, globalMax, globalRange]);

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_4px_14px_-2px_rgb(0_0_0/0.05)] overflow-hidden">
      {/* Chart area */}
      <div className="px-6 pt-6 pb-4">
        {/* Bars */}
        <div className="space-y-5">
          {cards.map((card, i) => {
            const leftPct = ((card.rangeMin - globalMin) / globalRange) * 100;
            const widthPct =
              ((card.rangeMax - card.rangeMin) / globalRange) * 100;
            const medianPct =
              ((card.mainNum - globalMin) / globalRange) * 100;
            const colors = LEVEL_COLORS[i % LEVEL_COLORS.length];

            return (
              <div
                key={card.level.en}
                className="animate-stagger-fade-up"
                style={{ "--stagger-index": i } as React.CSSProperties}
              >
                {/* Label row */}
                <div className="flex items-baseline justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                      }}
                    />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {localize(card.level, locale)}
                    </span>
                    <span className="text-[0.6875rem] text-gray-400">
                      {localize(card.experience, locale)}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-gray-900 tabular-nums">
                    {card.main}
                  </span>
                </div>

                {/* Bar track */}
                <div className="relative h-2.5 bg-gray-100 rounded-full overflow-visible">
                  {/* Filled range */}
                  <div
                    className="absolute top-0 h-full rounded-full animate-[salaryBarFill_0.8s_cubic-bezier(0.16,1,0.3,1)_both]"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
                      animationDelay: `${0.15 + i * 0.12}s`,
                    }}
                  />
                  {/* Median dot */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white bg-gray-900 z-10 animate-[dotIn_0.3s_ease_both]"
                    style={{
                      left: `${medianPct}%`,
                      marginLeft: "-6px",
                      animationDelay: `${0.6 + i * 0.12}s`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Shared scale axis */}
        <div className="relative mt-3 h-5">
          <div className="absolute top-0 left-0 right-0 h-px bg-gray-200" />
          {ticks.map((tick) => {
            const pct = ((tick - globalMin) / globalRange) * 100;
            return (
              <div
                key={tick}
                className="absolute top-0 flex flex-col items-center"
                style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
              >
                <div className="w-px h-1.5 bg-gray-300" />
                <span className="text-[0.5625rem] text-gray-400 mt-0.5 whitespace-nowrap">
                  {formatShort(tick)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Note footer */}
      <div className="px-6 py-3.5 bg-gray-50/80 border-t border-gray-100 text-xs text-gray-500 leading-relaxed">
        {localize(note, locale)}
      </div>

      {/* Inline animation */}
      <style>{`
        @keyframes salaryBarFill {
          from { transform: scaleX(0); transform-origin: left; }
          to { transform: scaleX(1); transform-origin: left; }
        }
        @keyframes dotIn {
          from { opacity: 0; transform: translateY(-50%) scale(0); }
          to { opacity: 1; transform: translateY(-50%) scale(1); }
        }
      `}</style>
    </div>
  );
}
