import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  current,
  previous,
  suffix,
}: {
  label: string;
  value: string | number;
  /** Numeric current/previous values drive the change line, when available. */
  current?: number;
  previous?: number | null;
  suffix?: string;
}) {
  let delta: number | null = null;
  if (typeof current === "number" && typeof previous === "number") {
    if (previous === 0) {
      delta = current === 0 ? 0 : 100;
    } else {
      delta = ((current - previous) / previous) * 100;
    }
  }

  return (
    <div className="min-w-0">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">
        {value}
        {suffix && <span className="ml-1 text-lg font-medium">{suffix}</span>}
      </p>
      {delta === null ? (
        <p className="mt-1.5 text-xs text-muted-foreground">Select a period to compare</p>
      ) : (
        <p
          className={cn(
            "mt-1.5 text-xs",
            delta > 0 && "text-positive",
            delta < 0 && "text-negative",
            delta === 0 && "text-muted-foreground",
          )}
        >
          {delta > 0 ? "+" : ""}
          {delta.toFixed(0)}% compared to previous period
        </p>
      )}
    </div>
  );
}
