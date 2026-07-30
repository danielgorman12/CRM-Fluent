// Shared Recharts styling so the bar and pie charts read as one system.
// Recharts needs concrete colour values rather than Tailwind classes for fills,
// so the palette is mirrored here from globals.css.

export const SERIES = {
  outreach: "#4c7fd4",
  responses: "#6fa96f",
};

// Cool-to-warm progression across the conversion stages.
export const STEP_COLORS = ["#94a3b8", "#4c7fd4", "#6fa96f", "#e8963c", "#16a34a"];

export const CHART_GRID = {
  strokeDasharray: "0",
  stroke: "#eef0f4",
  vertical: false,
} as const;

export const CHART_AXIS = {
  stroke: "transparent",
  tick: { fill: "#8a94a6", fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const;

export const CHART_TOOLTIP = {
  contentStyle: {
    borderRadius: 8,
    border: "1px solid #e8eaee",
    boxShadow: "0 4px 16px rgb(22 36 76 / 0.08)",
    fontSize: 12,
  },
  labelStyle: { color: "#16244c", fontWeight: 600 },
} as const;
