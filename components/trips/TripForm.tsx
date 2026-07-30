import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RADIUS_OPTIONS, UNIT_OPTIONS } from "@/lib/trip-planner";

const PER_DAY_OPTIONS = [2, 3, 4, 5];

export function TripForm({
  current,
  users,
}: {
  current: Record<string, string | undefined>;
  users: Array<{ id: string; name: string }>;
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form method="get" className="rounded-xl bg-muted/40 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1 space-y-1.5">
          <Label htmlFor="destination" className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Where are you going
          </Label>
          <Input
            id="destination"
            name="destination"
            required
            placeholder="e.g. Nashville, TN"
            defaultValue={current.destination ?? ""}
            className="bg-background"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="startDate" className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            From
          </Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={current.startDate ?? today}
            className="bg-background"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="endDate" className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            To
          </Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            required
            defaultValue={current.endDate ?? today}
            className="bg-background"
          />
        </div>

        <div className="w-28 space-y-1.5">
          <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Within
          </Label>
          <Select
            name="radius"
            defaultValue={current.radius ?? "250"}
            items={Object.fromEntries(RADIUS_OPTIONS.map((r) => [String(r), String(r)]))}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RADIUS_OPTIONS.map((r) => (
                <SelectItem key={r} value={String(r)}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-32 space-y-1.5">
          <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Unit
          </Label>
          <Select
            name="unit"
            defaultValue={current.unit ?? "mi"}
            items={Object.fromEntries(UNIT_OPTIONS.map((u) => [u.value, u.label]))}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIT_OPTIONS.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-32 space-y-1.5">
          <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Visits / day
          </Label>
          <Select
            name="perDay"
            defaultValue={current.perDay ?? "3"}
            items={Object.fromEntries(PER_DAY_OPTIONS.map((n) => [String(n), String(n)]))}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PER_DAY_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-40 space-y-1.5">
          <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Deals owned by
          </Label>
          <Select
            name="dealOwnerId"
            defaultValue={current.dealOwnerId}
            items={Object.fromEntries(users.map((u) => [u.id, u.name]))}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Anyone" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit">Plan trip</Button>
      </div>
    </form>
  );
}
