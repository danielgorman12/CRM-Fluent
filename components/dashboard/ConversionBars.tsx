"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP, STEP_COLORS } from "./chart-theme";

export function ConversionBars({ data }: { data: Array<{ label: string; count: number }> }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid {...CHART_GRID} />
          <XAxis dataKey="label" {...CHART_AXIS} />
          <YAxis allowDecimals={false} {...CHART_AXIS} />
          <Tooltip {...CHART_TOOLTIP} formatter={(v) => [`${Number(v)} prospects`, ""]} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={56}>
            <LabelList
              dataKey="count"
              position="top"
              className="fill-foreground text-xs font-semibold"
            />
            {data.map((_, i) => (
              <Cell key={i} fill={STEP_COLORS[i % STEP_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
