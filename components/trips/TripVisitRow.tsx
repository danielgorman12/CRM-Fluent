import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { logTripVisit, moveTripVisit, removeTripVisit } from "@/actions/trip-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { StageBadge } from "@/components/prospects/StageBadge";

export type VisitRow = {
  id: string;
  prospectId: string;
  prospectName: string;
  location: string | null;
  stageName: string;
  stageColor: string;
  distance: number;
  priority: number;
  /** ISO yyyy-mm-dd, so the day select can preselect the current day. */
  visitDate: string;
  logged: boolean;
  loggedOn: string | null;
};

export function TripVisitRow({
  visit,
  unit,
  dayOptions,
  index,
}: {
  visit: VisitRow;
  unit: string;
  dayOptions: Array<{ value: string; label: string }>;
  index: number;
}) {
  const logAction = logTripVisit.bind(null, visit.id);
  const moveVisitAction = moveTripVisit.bind(null, visit.id);
  const removeVisitAction = removeTripVisit.bind(null, visit.id);

  return (
    <li className="space-y-3 px-4 py-3.5">
      <div className="flex flex-wrap items-start gap-3">
        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold">
          {index + 1}
        </span>

        <div className="min-w-48 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/prospects/${visit.prospectId}`}
              className="text-sm font-medium hover:underline"
            >
              {visit.prospectName}
            </Link>
            <StageBadge name={visit.stageName} colorHex={visit.stageColor} />
            {visit.logged && (
              <span className="inline-flex items-center gap-1 text-xs text-positive">
                <CircleCheck className="size-3.5" />
                Logged
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
            {visit.location && <span>{visit.location}</span>}
            <span>
              {visit.distance.toFixed(0)} {unit} from base
            </span>
            <span>priority {visit.priority} when planned</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* A native select plus submit keeps this a plain form post. */}
          <form action={moveVisitAction} className="flex items-center gap-1.5">
            <select
              name="visitDate"
              defaultValue={visit.visitDate}
              aria-label={`Move ${visit.prospectName} to another day`}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              {dayOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline" size="sm">
              Move
            </Button>
          </form>

          <form action={removeVisitAction}>
            <Button type="submit" variant="ghost" size="sm">
              Remove
            </Button>
          </form>
        </div>
      </div>

      {visit.logged ? (
        <p className="pl-9 text-xs text-muted-foreground">
          Written to this prospect&apos;s activity log
          {visit.loggedOn ? ` on ${visit.loggedOn}` : ""}.{" "}
          <Link
            href={`/prospects/${visit.prospectId}/activity`}
            className="underline underline-offset-2"
          >
            View activity
          </Link>
        </p>
      ) : (
        <form action={logAction} className="flex flex-wrap items-end gap-2 pl-9">
          <div className="min-w-48 flex-1">
            <Input
              name="outcomeNotes"
              placeholder="How did the visit go?"
              className="h-8 text-xs"
              aria-label="Visit outcome"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Checkbox id={`responded-${visit.id}`} name="resultedInResponse" />
            <Label htmlFor={`responded-${visit.id}`} className="text-xs font-normal">
              Seller engaged
            </Label>
          </div>
          <Button type="submit" size="sm" variant="outline">
            Log visit
          </Button>
        </form>
      )}
    </li>
  );
}
