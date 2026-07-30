"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SlicePoint } from "@/lib/dashboard-queries";
import { CHART_TOOLTIP } from "./chart-theme";

export function StageDonut({ data }: { data: SlicePoint[] }) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  if (total === 0) {
    return (
      <div className="grid h-64 place-items-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">No prospects match these filters.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              {...CHART_TOOLTIP}
              formatter={(v, name) => {
                const count = Number(v);
                return [`${count} (${Math.round((count / total) * 100)}%)`, String(name)];
              }}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((slice) => (
                <Cell key={slice.label} fill={slice.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Total sits in the hole rather than as another label. */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-2xl font-semibold leading-none">{total}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">prospects</p>
          </div>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-1.5">
        {data.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2.5 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{slice.label}</span>
            <span className="font-medium">{slice.value}</span>
            <span className="w-9 text-right text-xs text-muted-foreground">
              {Math.round((slice.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
