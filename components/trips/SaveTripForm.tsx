import { saveTrip } from "@/actions/trip-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Carries the planner inputs through so the itinerary is recomputed on save. */
export function SaveTripForm({
  params,
  suggestedName,
}: {
  params: Record<string, string | undefined>;
  suggestedName: string;
}) {
  return (
    <form action={saveTrip} className="flex flex-wrap items-end gap-2">
      {Object.entries(params).map(([key, value]) =>
        value ? <input key={key} type="hidden" name={key} value={value} /> : null,
      )}
      <div className="w-56">
        <Input name="name" defaultValue={suggestedName} aria-label="Trip name" />
      </div>
      <Button type="submit" size="sm">
        Save this trip
      </Button>
    </form>
  );
}
