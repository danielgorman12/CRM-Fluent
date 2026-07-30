"use client";

import { FunnelChart as RechartsFunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#94a3b8", "#60a5fa", "#34d399", "#f97316", "#16a34a"];

export function FunnelChart({ data }: { data: Array<{ label: string; count: number }> }) {
  const chartData = data.map((d) => ({ name: d.label, value: d.count }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsFunnelChart>
          <Tooltip />
          <Funnel dataKey="value" data={chartData} isAnimationActive>
            <LabelList position="right" dataKey="name" stroke="none" className="fill-foreground text-sm" />
            <LabelList position="center" dataKey="value" stroke="none" className="fill-white text-sm font-medium" />
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Funnel>
        </RechartsFunnelChart>
      </ResponsiveContainer>
    </div>
  );
}
