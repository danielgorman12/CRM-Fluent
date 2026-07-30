"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "@/lib/dashboard-queries";
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP, SERIES } from "./chart-theme";

export function ActivityBarChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="grid h-64 place-items-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">No outreach logged in this period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-5 text-xs">
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: SERIES.outreach }} />
          <span className="text-muted-foreground">Outreach</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: SERIES.responses }} />
          <span className="text-muted-foreground">Responses</span>
        </span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={4}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis dataKey="label" {...CHART_AXIS} />
            <YAxis allowDecimals={false} {...CHART_AXIS} />
            <Tooltip {...CHART_TOOLTIP} cursor={{ fill: "#f6f7f9" }} />
            <Bar
              dataKey="outreach"
              name="Outreach"
              fill={SERIES.outreach}
              radius={[3, 3, 0, 0]}
              maxBarSize={14}
            />
            <Bar
              dataKey="responses"
              name="Responses"
              fill={SERIES.responses}
              radius={[3, 3, 0, 0]}
              maxBarSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
