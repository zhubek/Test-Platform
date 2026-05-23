"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
} from "recharts";

export interface ChartDatum {
  label: string;
  value: number;
  key: string;
}

export function ResultBarChart({
  data,
  color,
  topKey,
}: {
  data: ChartDatum[];
  color: string;
  topKey: string | null;
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 48)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 13 }}
        />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
          {data.map((d) => (
            <Cell
              key={d.key}
              fill={d.key === topKey ? color : color + "66"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
