"use client";

import { useMemo } from "react";
import type { WidgetComponentType, WidgetParam } from "../../../_components/mock-data";
import { localize } from "@/lib/localized";
import { useLocale } from "@/lib/locale-context";
import type { Localized } from "@/lib/localized";

type Row = Record<string, string | number>;

interface Props {
  componentType: WidgetComponentType;
  title: Localized;
  rows: Row[];
  params: WidgetParam[];
}

function getParam(params: WidgetParam[], key: string): string {
  return params.find((p) => p.key === key)?.value ?? "";
}

/** Extract {label, value} pairs from SQL rows. Picks first string col as label, first number col as value. */
function toDataPairs(rows: Row[]): { label: string; value: number }[] {
  if (rows.length === 0) return [];
  const cols = Object.keys(rows[0]);
  const labelCol = cols.find((c) => typeof rows[0][c] === "string") ?? cols[0];
  const valueCol = cols.find((c) => typeof rows[0][c] === "number") ?? cols[1] ?? cols[0];
  return rows.map((r) => ({
    label: String(r[labelCol]),
    value: Number(r[valueCol]) || 0,
  }));
}

// ── Bar Chart Preview ───────────────────────────────────────────

function BarChartPreview({ rows }: { rows: Row[] }) {
  const data = toDataPairs(rows);
  if (data.length === 0) return <EmptyPreview />;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2">
          <span className="w-24 text-[0.68rem] text-gray-500 text-right truncate">{d.label}</span>
          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="w-8 text-[0.68rem] text-gray-600 font-mono">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Pie Chart Preview ───────────────────────────────────────────

function PieChartPreview({ rows }: { rows: Row[] }) {
  const data = toDataPairs(rows);
  if (data.length === 0) return <EmptyPreview />;
  const total = data.reduce((s, d) => s + d.value, 0);
  const colors = ["#14b8a6", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

  let cumulative = 0;
  const segments = data.map((d, i) => {
    const pct = total > 0 ? (d.value / total) * 100 : 0;
    const start = cumulative;
    cumulative += pct;
    return { ...d, pct, start, color: colors[i % colors.length] };
  });

  const conicGradient = segments
    .map((s) => `${s.color} ${s.start}% ${s.start + s.pct}%`)
    .join(", ");

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-24 h-24 rounded-full shrink-0"
        style={{ background: `conic-gradient(${conicGradient})` }}
      />
      <div className="space-y-1 min-w-0">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-[0.68rem]">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-gray-600 truncate">{s.label}</span>
            <span className="text-gray-400 ml-auto">{Math.round(s.pct)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Radar Chart Preview ─────────────────────────────────────────

function RadarChartPreview({ rows }: { rows: Row[] }) {
  const data = toDataPairs(rows);
  if (data.length === 0) return <EmptyPreview />;
  const max = Math.max(...data.map((d) => d.value), 1);

  const cx = 80, cy = 80, r = 60;
  const n = data.length;
  const angleStep = (2 * Math.PI) / n;

  const points = data.map((d, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const ratio = d.value / max;
    return {
      x: cx + r * ratio * Math.cos(angle),
      y: cy + r * ratio * Math.sin(angle),
      lx: cx + (r + 14) * Math.cos(angle),
      ly: cy + (r + 14) * Math.sin(angle),
      label: d.label,
    };
  });

  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox="0 0 160 160" className="w-full max-w-[200px] mx-auto">
      {gridLevels.map((level) => {
        const pts = Array.from({ length: n }, (_, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          return `${cx + r * level * Math.cos(angle)},${cy + r * level * Math.sin(angle)}`;
        }).join(" ");
        return <polygon key={level} points={pts} fill="none" stroke="#e5e7eb" strokeWidth="0.5" />;
      })}
      {points.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(-Math.PI / 2 + i * angleStep)} y2={cy + r * Math.sin(-Math.PI / 2 + i * angleStep)} stroke="#e5e7eb" strokeWidth="0.5" />
      ))}
      <polygon points={polygon} fill="rgba(20, 184, 166, 0.3)" stroke="#14b8a6" strokeWidth="1.5" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#14b8a6" />
      ))}
      {points.map((p, i) => (
        <text key={i} x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle" className="text-[6px] fill-gray-500">
          {p.label.length > 8 ? p.label.slice(0, 7) + "…" : p.label}
        </text>
      ))}
    </svg>
  );
}

// ── Score Table Preview ─────────────────────────────────────────

function ScoreTablePreview({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return <EmptyPreview />;
  const cols = Object.keys(rows[0]);

  return (
    <table className="w-full text-[0.72rem]">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-1.5 px-2 text-gray-400 font-medium w-8">#</th>
          {cols.map((col) => (
            <th key={col} className="text-left py-1.5 px-2 text-gray-400 font-medium">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-gray-50">
            <td className="py-1.5 px-2 text-gray-400">{i + 1}</td>
            {cols.map((col) => (
              <td key={col} className="py-1.5 px-2 text-gray-700 font-mono">
                {row[col]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Stat Card Preview ───────────────────────────────────────────

function StatCardPreview({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return <EmptyPreview />;
  const cols = Object.keys(rows[0]);
  const numCol = cols.find((c) => typeof rows[0][c] === "number") ?? cols[0];
  const value = Number(rows[0][numCol]) || 0;
  const isPct = numCol.toLowerCase().includes("pct") || numCol.toLowerCase().includes("percent") || numCol.toLowerCase().includes("rate");

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <span className="text-3xl font-bold text-gray-900">
        {isPct ? `${value}%` : value}
      </span>
      <span className="text-[0.75rem] text-gray-400 mt-1">{numCol}</span>
    </div>
  );
}

// ── Summary Text Preview ────────────────────────────────────────

function SummaryTextPreview({ rows }: { rows: Row[] }) {
  const data = toDataPairs(rows);
  if (data.length === 0) return <EmptyPreview />;

  const lines = data
    .slice(0, 3)
    .map((d, i) => `${i + 1}. ${d.label} — ${d.value}`)
    .join("\n");

  return (
    <div className="text-[0.78rem] text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3 whitespace-pre-line">
      {`Top results:\n${lines}`}
    </div>
  );
}

// ── Custom HTML Preview ─────────────────────────────────────────

export function CustomHtmlPreview({ params, rows }: { params: WidgetParam[]; rows: Row[] }) {
  const html = getParam(params, "html");

  const srcDoc = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 12px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #374151;
    background: #ffffff;
  }
  h1, h2, h3, h4, h5, h6 { margin: 0 0 0.5em; font-weight: 600; color: #111827; }
  h1 { font-size: 1.5em; } h2 { font-size: 1.25em; } h3 { font-size: 1.1em; }
  p { margin: 0 0 0.75em; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85em; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
  th { font-weight: 600; color: #6b7280; font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.03em; }
  code { font-family: ui-monospace, monospace; font-size: 0.9em; background: #f3f4f6; padding: 2px 4px; border-radius: 3px; }
  a { color: #0d9488; text-decoration: none; }
  a:hover { text-decoration: underline; }
</style>
</head>
<body>
<script>window.__rows__ = ${JSON.stringify(rows)};<\/script>
${html}
</body>
</html>`;
  }, [html, rows]);

  return (
    <iframe
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      className="w-full border border-gray-200 rounded-lg bg-white"
      style={{ minHeight: 120, height: 200 }}
      title="Custom HTML preview"
    />
  );
}

// ── Empty state ─────────────────────────────────────────────────

function EmptyPreview() {
  return (
    <div className="text-[0.72rem] text-gray-300 text-center py-6">
      Write an SQL query to see preview
    </div>
  );
}

// ── Main Preview Router ─────────────────────────────────────────

export function WidgetPreview({ componentType, title, rows, params }: Props) {
  const { locale } = useLocale();
  const titleText = localize(title, locale);

  return (
    <div className="space-y-2">
      {titleText && (
        <h4 className="text-[0.78rem] font-semibold text-gray-700">{titleText}</h4>
      )}
      <div>
        {componentType === "bar_chart" && <BarChartPreview rows={rows} />}
        {componentType === "pie_chart" && <PieChartPreview rows={rows} />}
        {componentType === "radar_chart" && <RadarChartPreview rows={rows} />}
        {componentType === "score_table" && <ScoreTablePreview rows={rows} />}
        {componentType === "stat_card" && <StatCardPreview rows={rows} />}
        {componentType === "summary_text" && <SummaryTextPreview rows={rows} />}
        {componentType === "custom_html" && <CustomHtmlPreview params={params} rows={rows} />}
      </div>
    </div>
  );
}
