"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface CompletionDatum {
  test: string;
  completed: number;
  total: number;
}

export function CompletionChart({ data }: { data: CompletionDatum[] }) {
  const rows = data.map((d) => ({
    ...d,
    rate: d.total ? Math.round((d.completed / d.total) * 100) : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="test"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          unit="%"
        />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
          formatter={(value) => [`${value}%`, "Completion"]}
        />
        <Bar dataKey="rate" radius={[6, 6, 0, 0]} barSize={56}>
          {rows.map((r) => (
            <Cell key={r.test} fill="var(--primary)" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
