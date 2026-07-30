import Link from "next/link";
import type { TripDay, TripUnit } from "@/lib/trip-planner";
import { StageBadge } from "@/components/prospects/StageBadge";

function FactorBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <span className="block h-full rounded-full bg-chart-1" style={{ width: `${value}%` }} />
      </span>
      <span className="w-7 text-right text-[11px] text-muted-foreground">{value}</span>
    </div>
  );
}

export function ItineraryDay({ day, unit }: { day: TripDay; unit: TripUnit }) {
  return (
    <section className="rounded-xl border">
      <header className="flex items-center justify-between border-b px-4 py-2.5">
        <h3 className="text-sm font-semibold">{day.label}</h3>
        <span className="text-xs text-muted-foreground">
          {day.stops.length} {day.stops.length === 1 ? "visit" : "visits"}
        </span>
      </header>

      {day.stops.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground">
          No further prospects worth a visit in range — consider a shorter trip.
        </p>
      ) : (
        <ol className="divide-y">
          {day.stops.map((stop, i) => (
            <li key={stop.id} className="flex flex-wrap gap-4 px-4 py-3.5">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold">
                {i + 1}
              </span>

              <div className="min-w-52 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/prospects/${stop.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {stop.name}
                  </Link>
                  <StageBadge name={stop.stageName} colorHex={stop.stageColor} />
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  {stop.location && <span>{stop.location}</span>}
                  <span>
                    {stop.distance.toFixed(0)} {unit} away
                  </span>
                  {stop.vertical && <span>{stop.vertical}</span>}
                  {stop.arr !== null && (
                    <span className="font-medium text-foreground">
                      ${(stop.arr / 1_000_000).toFixed(1)}M ARR
                    </span>
                  )}
                </div>
              </div>

              {/* Show what drove the ranking rather than just a score. */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-semibold leading-none">{stop.priority}</span>
                  <span className="text-[11px] text-muted-foreground">priority</span>
                </div>
                <FactorBar label="Proximity" value={stop.factors.distance} />
                <FactorBar label="Momentum" value={stop.factors.momentum} />
                <FactorBar
                  label={stop.scorecardScore === null ? "Score n/a" : "Scorecard"}
                  value={stop.factors.scorecard}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
