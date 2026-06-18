"use client";

// The widget catalog: ready, data-bound components that blocks reference by
// name — e.g. <widget name="bar-chart" data-source="scores" data-x="name" .../>.
// Charts are thin wrappers over Recharts; the author binds data + a few props
// and styles the surrounding card with Tailwind. To add a widget, implement it
// and register it in WIDGETS at the bottom.

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart,
  RadialBar, RadialBarChart, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip, XAxis, YAxis, ZAxis,
} from "recharts";
import { TEST_WIDGETS } from "./view-widgets-test";
import { UntChart } from "@/app/professions/[id]/_components/unt-chart";

type Row = Record<string, unknown>;

// Named color tokens → hex, so authors can write data-color="teal" or a raw hex.
const TOKENS: Record<string, string> = {
  teal: "#0d9488", blue: "#3b82f6", indigo: "#6366f1", violet: "#8b5cf6",
  amber: "#f59e0b", rose: "#f43f5e", green: "#22c55e", gray: "#64748b",
};
const PALETTE = ["#0d9488", "#3b82f6", "#f59e0b", "#8b5cf6", "#f43f5e", "#22c55e", "#6366f1", "#14b8a6"];
const color = (c?: string) => (!c ? TOKENS.teal : c.startsWith("#") ? c : TOKENS[c] ?? TOKENS.teal);
const rows = (d: unknown): Row[] => (Array.isArray(d) ? (d as Row[]) : []);
const num = (v: unknown, fallback = 0) => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
};

const TOOLTIP = {
  cursor: { fill: "rgba(0,0,0,0.04)" },
  contentStyle: { borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 },
} as const;

// A sized frame so ResponsiveContainer never collapses (author height via class).
// The minHeight on ResponsiveContainer guards the first-paint race where the
// container measures 0 before layout settles. A residual dev-only "width(-1)"
// warning can still log once for charts inside scaled thumbnails; it is benign
// (the chart renders correctly once measured).
function Frame({ className, style, children }: { className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div className={className} style={{ width: "100%", minHeight: 220, ...style }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

interface P {
  data?: unknown;
  className?: string;
  style?: React.CSSProperties;
  [k: string]: unknown;
}

function BarWidget({ data, x = "name", y = "value", ...p }: P) {
  return (
    <Frame className={p.className} style={p.style}>
      <BarChart data={rows(data)} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey={String(x)} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <Tooltip {...TOOLTIP} />
        <Bar dataKey={String(y)} fill={color(p.color as string)} radius={[6, 6, 0, 0]} />
      </BarChart>
    </Frame>
  );
}

function LineWidget({ data, x = "name", y = "value", ...p }: P) {
  return (
    <Frame className={p.className} style={p.style}>
      <LineChart data={rows(data)} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey={String(x)} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <Tooltip {...TOOLTIP} cursor={{ stroke: "#cbd5e1" }} />
        <Line type="monotone" dataKey={String(y)} stroke={color(p.color as string)} strokeWidth={2.5} dot={false} />
      </LineChart>
    </Frame>
  );
}

function AreaWidget({ data, x = "name", y = "value", ...p }: P) {
  const c = color(p.color as string);
  return (
    <Frame className={p.className} style={p.style}>
      <AreaChart data={rows(data)} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity={0.35} />
            <stop offset="100%" stopColor={c} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey={String(x)} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <Tooltip {...TOOLTIP} cursor={{ stroke: "#cbd5e1" }} />
        <Area type="monotone" dataKey={String(y)} stroke={c} strokeWidth={2.5} fill="url(#area-fill)" />
      </AreaChart>
    </Frame>
  );
}

function PieWidget({ data, nameKey = "name", valueKey = "value", inner = "0", ...p }: P) {
  const d = rows(data);
  return (
    <Frame className={p.className} style={p.style}>
      <PieChart>
        <Tooltip {...TOOLTIP} cursor={false} />
        <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12 }} />
        <Pie
          data={d}
          dataKey={String(valueKey)}
          nameKey={String(nameKey)}
          innerRadius={`${num(inner)}%`}
          outerRadius="78%"
          paddingAngle={num(inner) > 0 ? 2 : 0}
        >
          {d.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
      </PieChart>
    </Frame>
  );
}

function DonutWidget(p: P) {
  return <PieWidget {...p} inner={(p.inner as string) ?? "58"} />;
}

function RadarWidget({ data, subjectKey = "subject", valueKey = "value", ...p }: P) {
  return (
    <Frame className={p.className} style={p.style}>
      <RadarChart data={rows(data)} outerRadius="72%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey={String(subjectKey)} tick={{ fontSize: 12 }} />
        <PolarRadiusAxis tick={{ fontSize: 10 }} axisLine={false} />
        <Tooltip {...TOOLTIP} cursor={false} />
        <Radar dataKey={String(valueKey)} stroke={color(p.color as string)} fill={color(p.color as string)} fillOpacity={0.3} />
      </RadarChart>
    </Frame>
  );
}

function GaugeWidget({ value, max = "100", label, ...p }: P) {
  const pct = Math.max(0, Math.min(100, (num(value) / num(max, 100)) * 100));
  const c = color(p.color as string);
  return (
    <div className={p.className as string} style={{ position: "relative", width: "100%", minHeight: 220, ...(p.style as object) }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        <RadialBarChart data={[{ name: "v", value: pct, fill: c }]} innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={12} background={{ fill: "#f1f5f9" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>{Math.round(pct)}%</span>
        {label ? <span style={{ fontSize: 12, color: "#64748b" }}>{String(label)}</span> : null}
      </div>
    </div>
  );
}

// UNT minimum points by year — the exact chart from the profession education
// view (grant-type switcher, area fill, value labels, its own card). Expects
// the catalog shape: { general: number[], aul: number[], ... } per grant type;
// a plain [{ year, points }] row list is treated as the general grant.
function UntChartWidget({ data, ...p }: P) {
  let points: Record<string, number[]> | null = null;
  if (Array.isArray(data)) {
    const values = data
      .map((r) => num((r as Row)?.points ?? (r as Row)?.value, NaN))
      .filter((v) => Number.isFinite(v));
    if (values.length) points = { general: values };
  } else if (data && typeof data === "object") {
    points = data as Record<string, number[]>;
  }
  if (!points || Object.keys(points).length === 0) return null;
  return (
    <div className={p.className as string} style={p.style as React.CSSProperties}>
      <UntChart points={points} />
    </div>
  );
}

function ScatterWidget({ data, x = "x", y = "y", ...p }: P) {
  return (
    <Frame className={p.className} style={p.style}>
      <ScatterChart margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis type="number" dataKey={String(x)} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis type="number" dataKey={String(y)} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <ZAxis range={[60, 60]} />
        <Tooltip {...TOOLTIP} cursor={{ strokeDasharray: "3 3" }} />
        <Scatter data={rows(data)} fill={color(p.color as string)} />
      </ScatterChart>
    </Frame>
  );
}

export const WIDGETS: Record<string, React.ComponentType<P>> = {
  // Display widgets (dashboards / results / catalogs)
  "bar-chart": BarWidget,
  "line-chart": LineWidget,
  "area-chart": AreaWidget,
  "pie-chart": PieWidget,
  "donut-chart": DonutWidget,
  "radar-chart": RadarWidget,
  "radial-gauge": GaugeWidget,
  "scatter-chart": ScatterWidget,
  "unt-chart": UntChartWidget,
  // Test question widgets (interactive answer controls)
  ...TEST_WIDGETS,
};

export type WidgetName = keyof typeof WIDGETS;
