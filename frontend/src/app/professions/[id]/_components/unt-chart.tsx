"use client";

import { useState, useMemo, useId } from "react";
import { useLocale } from "@/lib/locale-context";

const YEARS = [2021, 2022, 2023, 2024, 2025];

const GRANT_LINES = [
  { key: "general", label: "General Grant", color: "#1a56db" },
  { key: "aul", label: "Aul Grant", color: "#059669" },
  { key: "serpin", label: "Serpin Grant", color: "#d97706" },
  { key: "gos", label: "Gos Grant", color: "#dc2626" },
] as const;

// Chart layout — compact viewBox, responsive font sizes via CSS classes
const PAD = { top: 36, right: 28, bottom: 40, left: 50 };
const W = 500;
const H = 240;
const CW = W - PAD.left - PAD.right;
const CH = H - PAD.top - PAD.bottom;

interface Props {
  points: Record<string, number[]>;
}

export function UntChart({ points }: Props) {
  const { t } = useLocale();
  const [activeGrant, setActiveGrant] = useState("general");
  // Key to force re-mount for animations
  const [animKey, setAnimKey] = useState(0);
  const uid = useId();

  const vals = points[activeGrant] ?? [];
  const available = GRANT_LINES.filter((g) => points[g.key]);

  const { minV, maxV } = useMemo(() => {
    if (vals.length === 0) return { minV: 0, maxV: 100 };
    const min = Math.floor(Math.min(...vals) / 5) * 5 - 5;
    const max = Math.ceil(Math.max(...vals) / 5) * 5 + 5;
    return { minV: min, maxV: max };
  }, [vals]);

  const range = maxV - minV || 1;
  const gridSteps = 4;

  function toX(i: number) {
    return PAD.left + (CW * i) / (YEARS.length - 1);
  }

  function toY(v: number) {
    return PAD.top + CH - (CH * (v - minV)) / range;
  }

  // Build path
  const linePath = vals
    .map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`)
    .join(" ");

  // Area path (closed to bottom)
  const areaPath =
    linePath +
    ` L ${toX(vals.length - 1)} ${PAD.top + CH} L ${toX(0)} ${PAD.top + CH} Z`;

  // Approximate path length for dash animation
  const pathLen = vals.length > 1 ? CW * 1.5 : 0;

  const activeColor =
    GRANT_LINES.find((g) => g.key === activeGrant)?.color ?? "#1a56db";

  function switchGrant(key: string) {
    if (key === activeGrant) return;
    setActiveGrant(key);
    setAnimKey((k) => k + 1);
  }

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-5 md:p-6 mb-5 shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_4px_14px_-2px_rgb(0_0_0/0.05)]">
      <div className="text-sm font-bold text-gray-500 mb-3">
        {t("professionDetail.unt.title")}
      </div>

      {/* Grant switcher */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {available.map((g) => (
          <button
            key={g.key}
            onClick={() => switchGrant(g.key)}
            className={
              "rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all duration-200 " +
              (activeGrant === g.key
                ? "text-white border-transparent shadow-sm"
                : "text-gray-500 border-gray-200 bg-gray-50/80 hover:border-gray-300 hover:text-gray-700")
            }
            style={
              activeGrant === g.key
                ? { backgroundColor: g.color }
                : undefined
            }
          >
            {t(`professionDetail.unt.grant.${g.key}`)}
          </button>
        ))}
      </div>

      {/* Chart */}
      {vals.length > 0 && (
        <svg
          key={animKey}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          aria-label="UNT points chart"
        >
          <defs>
            <linearGradient
              id={`${uid}-area`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={activeColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={activeColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines + Y labels */}
          {Array.from({ length: gridSteps + 1 }).map((_, i) => {
            const y = PAD.top + CH - (CH * i) / gridSteps;
            const label = Math.round(minV + (range * i) / gridSteps);
            return (
              <g key={i}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={PAD.left + CW}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={PAD.left - 10}
                  y={y + 5}
                  textAnchor="end"
                  fill="#9ca3af"
                  fontSize="14"
                  fontFamily="system-ui, sans-serif"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* X labels (years) */}
          {YEARS.map((yr, i) => (
            <text
              key={yr}
              x={toX(i)}
              y={H - 8}
              textAnchor="middle"
              fill="#9ca3af"
              fontSize="14"
              fontFamily="system-ui, sans-serif"
            >
              {yr}
            </text>
          ))}

          {/* Area fill */}
          <path
            d={areaPath}
            fill={`url(#${uid}-area)`}
            className="animate-[fadeIn_0.6s_ease_0.3s_both]"
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={activeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={pathLen}
            strokeDashoffset={pathLen}
            className="animate-[drawLine_0.8s_ease-out_forwards]"
          />

          {/* Dots + value labels */}
          {vals.map((v, i) => {
            const cx = toX(i);
            const cy = toY(v);
            const delay = 0.3 + i * 0.1;
            return (
              <g key={i}>
                {/* White ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="6"
                  fill="white"
                  style={{
                    opacity: 0,
                    animation: `dotIn 0.3s ease ${delay}s forwards`,
                  }}
                />
                {/* Colored dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="4"
                  fill={activeColor}
                  style={{
                    opacity: 0,
                    animation: `dotIn 0.3s ease ${delay}s forwards`,
                  }}
                />
                {/* Value label */}
                <text
                  x={cx}
                  y={cy - 16}
                  textAnchor="middle"
                  fill="#374151"
                  fontSize="15"
                  fontWeight="700"
                  fontFamily="system-ui, sans-serif"
                  style={{
                    opacity: 0,
                    animation: `fadeIn 0.3s ease ${delay + 0.1}s forwards`,
                  }}
                >
                  {v}
                </text>
              </g>
            );
          })}

          {/* Inline style for SVG animations */}
          <style>{`
            @keyframes drawLine {
              to { stroke-dashoffset: 0; }
            }
            @keyframes dotIn {
              from { opacity: 0; transform: scale(0); }
              to { opacity: 1; transform: scale(1); }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
        </svg>
      )}
    </div>
  );
}
