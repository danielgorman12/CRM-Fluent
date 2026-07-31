// Shared Recharts styling so the bar and pie charts read as one system.
// Recharts needs concrete colour values rather than Tailwind classes for fills,
// so the palette is mirrored here from globals.css — which in turn follows
// fluentsoftwaregroup.com.

export const SERIES = {
  outreach: "#1764d7",
  responses: "#5b9bf0",
};

// Cool-to-warm progression across the conversion stages, ending on green.
export const STEP_COLORS = ["#9aa3b8", "#5b9bf0", "#1764d7", "#e8a33d", "#1e7a46"];

export const CHART_GRID = {
  strokeDasharray: "0",
  stroke: "#e6e4dc",
  vertical: false,
} as const;

export const CHART_AXIS = {
  stroke: "transparent",
  tick: { fill: "#545c77", fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const;

export const CHART_TOOLTIP = {
  contentStyle: {
    borderRadius: 8,
    border: "1px solid #e3e1d9",
    backgroundColor: "#fcfcfa",
    boxShadow: "0 4px 16px rgb(18 30 68 / 0.10)",
    fontSize: 12,
  },
  labelStyle: { color: "#121e44", fontWeight: 600 },
} as const;
