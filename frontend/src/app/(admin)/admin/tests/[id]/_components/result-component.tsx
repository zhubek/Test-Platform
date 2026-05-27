"use client";

import { Trophy } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import type { ResultComponent } from "../../../_components/mock-data";

// A data pair the result renderers consume. `label` is already localized.
export interface ResultDatum {
  label: string;
  value: number;
}

interface Props {
  component: ResultComponent;
  data: ResultDatum[]; // resolved sample/real values for the component's binding
}

// Renders one result component as the student would see it.
export function ResultComponentView({ component, data }: Props) {
  const { locale } = useLocale();
  const title = localize(component.title, locale);
  const content = component.content ? localize(component.content, locale) : "";
  const opts = component.options ?? {};

  // ── Static layout blocks (not data-bound) ──
  if (component.type === "divider") {
    return <hr className="my-2 border-border" />;
  }
  if (component.type === "heading") {
    return <h2 className="text-xl font-bold tracking-tight">{title || content || "Heading"}</h2>;
  }
  if (component.type === "text") {
    return (
      <p className="whitespace-pre-line text-[0.86rem] leading-relaxed text-muted-foreground">
        {content || "Text block"}
      </p>
    );
  }

  // Apply structured options: sort, then count.
  let shown = [...data];
  if (opts.sort === "score_desc") shown.sort((a, b) => b.value - a.value);
  else if (opts.sort === "score_asc") shown.sort((a, b) => a.value - b.value);
  if (opts.count && opts.count > 0) shown = shown.slice(0, opts.count);

  const showValues = opts.showValues !== false; // default true

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      {title && <h3 className="mb-4 text-sm font-bold tracking-tight">{title}</h3>}
      {shown.length === 0 ? (
        <p className="py-6 text-center text-[0.78rem] text-muted-foreground">No data to display.</p>
      ) : component.type === "characteristics_bar" ? (
        <BarChart data={shown} maxScale={opts.maxScale} showValues={showValues} />
      ) : component.type === "characteristics_radar" ? (
        <RadarChart data={shown} maxScale={opts.maxScale} />
      ) : component.type === "characteristics_pie" ? (
        <PieChart data={shown} showValues={showValues} />
      ) : component.type === "score_table" ? (
        <ScoreTable data={shown} showValues={showValues} />
      ) : component.type === "stat_grid" ? (
        <StatGrid data={shown} />
      ) : component.type === "summary_text" ? (
        <SummaryText data={shown} />
      ) : component.type === "score_card" ? (
        <ScoreCard data={shown} showValues={showValues} />
      ) : component.type === "gauge" ? (
        <Gauge data={shown} maxScale={opts.maxScale} />
      ) : component.type === "match_detail" ? (
        <MatchDetail data={shown} />
      ) : (
        <MatchesList data={shown} showValues={showValues} />
      )}
    </div>
  );
}

// ── Bar chart: characteristics, top score highlighted ───────────
function BarChart({ data, maxScale, showValues }: { data: ResultDatum[]; maxScale?: number; showValues: boolean }) {
  const max = maxScale && maxScale > 0 ? maxScale : Math.max(...data.map((d) => d.value), 1);
  const topVal = Math.max(...data.map((d) => d.value));
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-right text-[0.78rem] text-muted-foreground">
            {d.label}
          </span>
          <div className="h-5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                d.value === topVal ? "bg-foreground" : "bg-foreground/40",
              )}
              style={{ width: `${Math.min(100, (d.value / max) * 100)}%` }}
            />
          </div>
          {showValues && (
            <span className="w-8 shrink-0 text-right text-[0.74rem] font-semibold tabular-nums">
              {round(d.value)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Radar / spider chart ────────────────────────────────────────
function RadarChart({ data, maxScale }: { data: ResultDatum[]; maxScale?: number }) {
  const max = maxScale && maxScale > 0 ? maxScale : Math.max(...data.map((d) => d.value), 1);
  const cx = 110;
  const cy = 110;
  const r = 78;
  const n = data.length;
  const step = (2 * Math.PI) / n;
  const pts = data.map((d, i) => {
    const a = -Math.PI / 2 + i * step;
    const ratio = d.value / max;
    return {
      x: cx + r * ratio * Math.cos(a),
      y: cy + r * ratio * Math.sin(a),
      lx: cx + (r + 18) * Math.cos(a),
      ly: cy + (r + 18) * Math.sin(a),
      label: d.label,
    };
  });
  const polygon = pts.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <svg viewBox="0 0 220 220" className="mx-auto w-full max-w-[260px]">
      {[0.25, 0.5, 0.75, 1].map((level) => (
        <polygon
          key={level}
          points={Array.from({ length: n }, (_, i) => {
            const a = -Math.PI / 2 + i * step;
            return `${cx + r * level * Math.cos(a)},${cy + r * level * Math.sin(a)}`;
          }).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-border"
        />
      ))}
      {pts.map((_, i) => {
        const a = -Math.PI / 2 + i * step;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + r * Math.cos(a)}
            y2={cy + r * Math.sin(a)}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-border"
          />
        );
      })}
      <polygon points={polygon} className="fill-foreground/20 stroke-foreground" strokeWidth="1.5" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" className="fill-foreground" />
      ))}
      {pts.map((p, i) => (
        <text
          key={i}
          x={p.lx}
          y={p.ly}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground text-[8px]"
        >
          {p.label.length > 10 ? p.label.slice(0, 9) + "…" : p.label}
        </text>
      ))}
    </svg>
  );
}

// ── Score card: single prominent value (the top item) ───────────
function ScoreCard({ data, showValues }: { data: ResultDatum[]; showValues: boolean }) {
  const top = [...data].sort((a, b) => b.value - a.value)[0];
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <Trophy className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xl font-bold tracking-tight">{top.label}</p>
        {showValues && <p className="text-[0.78rem] text-muted-foreground">Score: {round(top.value)}</p>}
      </div>
    </div>
  );
}

// ── Matches list: ranked top-N with score bars ──────────────────
function MatchesList({ data, showValues }: { data: ResultDatum[]; showValues: boolean }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ol className="space-y-2">
      {data.map((d, i) => (
        <li key={d.label} className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[0.7rem] font-bold text-muted-foreground">
            {i + 1}
          </span>
          <span className="w-32 shrink-0 truncate text-[0.82rem] font-medium">{d.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-foreground" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          {showValues && (
            <span className="w-10 shrink-0 text-right text-[0.74rem] tabular-nums text-muted-foreground">
              {round(d.value)}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

// ── Pie / donut: characteristic distribution ────────────────────
const PIE_COLORS = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0", "#475569", "#1e293b"];
function PieChart({ data, showValues }: { data: ResultDatum[]; showValues: boolean }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;
  const segs = data.map((d, i) => {
    const pct = (d.value / total) * 100;
    const start = acc;
    acc += pct;
    return { ...d, pct, start, color: PIE_COLORS[i % PIE_COLORS.length] };
  });
  const gradient = segs.map((s) => `${s.color} ${s.start}% ${s.start + s.pct}%`).join(", ");
  return (
    <div className="flex items-center gap-5">
      <div
        className="relative h-28 w-28 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
      >
        <div className="absolute inset-[22%] rounded-full bg-card" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        {segs.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-[0.74rem]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="truncate text-muted-foreground">{s.label}</span>
            <span className="ml-auto tabular-nums text-muted-foreground">
              {showValues ? `${Math.round(s.pct)}%` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Score table: ranked characteristic | score ─────────────────
function ScoreTable({ data, showValues }: { data: ResultDatum[]; showValues: boolean }) {
  return (
    <table className="w-full text-[0.8rem]">
      <tbody>
        {data.map((d, i) => (
          <tr key={d.label} className="border-b border-border/60 last:border-0">
            <td className="w-7 py-1.5 text-muted-foreground">{i + 1}</td>
            <td className="py-1.5 font-medium">{d.label}</td>
            {showValues && <td className="py-1.5 text-right tabular-nums text-muted-foreground">{round(d.value)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Stat grid: small cards of key numbers ───────────────────────
function StatGrid({ data }: { data: ResultDatum[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {data.map((d) => (
        <div key={d.label} className="rounded-xl border bg-muted/30 p-3 text-center">
          <p className="text-xl font-bold tabular-nums">{round(d.value)}</p>
          <p className="truncate text-[0.7rem] text-muted-foreground">{d.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Summary text: "Your top types are X, Y and Z." ──────────────
function SummaryText({ data }: { data: ResultDatum[] }) {
  const top = [...data].sort((a, b) => b.value - a.value).slice(0, 3).map((d) => d.label);
  const list = top.length <= 1 ? top.join("") : `${top.slice(0, -1).join(", ")} and ${top[top.length - 1]}`;
  return (
    <p className="text-[0.86rem] leading-relaxed">
      Your strongest areas are <span className="font-semibold">{list}</span>.
    </p>
  );
}

// ── Gauge: single value as a 0–max arc meter ────────────────────
function Gauge({ data, maxScale }: { data: ResultDatum[]; maxScale?: number }) {
  const top = [...data].sort((a, b) => b.value - a.value)[0];
  const max = maxScale && maxScale > 0 ? maxScale : 100;
  const ratio = Math.max(0, Math.min(1, top.value / max));
  const r = 52;
  const circ = Math.PI * r; // half circle
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 140 80" className="w-44">
        <path d="M 18 70 A 52 52 0 0 1 122 70" fill="none" className="stroke-muted" strokeWidth="12" strokeLinecap="round" />
        <path
          d="M 18 70 A 52 52 0 0 1 122 70"
          fill="none"
          className="stroke-foreground"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - ratio)}
        />
      </svg>
      <p className="-mt-2 text-2xl font-bold tabular-nums">{round(top.value)}</p>
      <p className="text-[0.74rem] text-muted-foreground">{top.label}</p>
    </div>
  );
}

// ── Match detail: the #1 catalog match prominently ──────────────
function MatchDetail({ data }: { data: ResultDatum[] }) {
  const top = [...data].sort((a, b) => b.value - a.value)[0];
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
        <Trophy className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-[0.66rem] font-semibold uppercase tracking-wider text-muted-foreground">Your top match</p>
        <p className="truncate text-xl font-bold tracking-tight">{top.label}</p>
        <p className="text-[0.78rem] text-muted-foreground">Match score: {round(top.value)}</p>
      </div>
    </div>
  );
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}
