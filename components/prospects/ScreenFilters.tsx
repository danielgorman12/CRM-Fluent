import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COLUMN_GROUPS, type ColumnGroup } from "@/lib/screening";

type Option = { id: string; name: string };

export function ScreenFilters({
  verticals,
  stages,
  users,
  countries,
  current,
  group,
}: {
  verticals: Option[];
  stages: Option[];
  users: Option[];
  countries: string[];
  current: Record<string, string | undefined>;
  group: ColumnGroup | "all";
}) {
  return (
    <div className="space-y-3">
      {/* Column groups switch which metrics are shown without losing filters. */}
      <div className="flex flex-wrap items-center gap-2">
        {COLUMN_GROUPS.map((g) => {
          const search = new URLSearchParams();
          for (const [key, value] of Object.entries(current)) {
            if (value) search.set(key, value);
          }
          search.set("cols", g.value);
          return (
            <Button
              key={g.value}
              size="sm"
              variant={group === g.value ? "default" : "outline"}
              render={<Link href={`/prospects?${search.toString()}`}>{g.label}</Link>}
            />
          );
        })}
      </div>

      <form method="get" className="space-y-3 rounded-xl bg-muted/40 p-4">
        <input type="hidden" name="cols" value={group} />
        {current.sort && <input type="hidden" name="sort" value={current.sort} />}
        {current.dir && <input type="hidden" name="dir" value={current.dir} />}

        <div className="flex flex-wrap items-end gap-3">
          <Picker name="verticalId" label="Vertical" placeholder="All verticals" value={current.verticalId} options={verticals.map((v) => ({ value: v.id, label: v.name }))} />
          <Picker name="stageId" label="Stage" placeholder="Any stage" value={current.stageId} options={stages.map((s) => ({ value: s.id, label: s.name }))} />
          <Picker name="dealOwnerId" label="Deal owner" placeholder="Anyone" value={current.dealOwnerId} options={users.map((u) => ({ value: u.id, label: u.name }))} />
          <Picker name="country" label="Country" placeholder="All countries" value={current.country} options={countries.map((c) => ({ value: c, label: c }))} />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Threshold name="minArr" label="Min ARR ($)" value={current.minArr} placeholder="e.g. 2000000" />
          <Threshold name="minEbitdaMargin" label="Min margin (%)" value={current.minEbitdaMargin} placeholder="e.g. 20" />
          <Threshold name="minNetRetention" label="Min net retention (%)" value={current.minNetRetention} placeholder="e.g. 100" />
          <Threshold name="minScore" label="Min score" value={current.minScore} placeholder="1–10" />
          <Threshold name="maxEbitdaMultiple" label="Max EBITDA multiple" value={current.maxEbitdaMultiple} placeholder="e.g. 6" />

          <div className="flex items-center gap-2 pb-2">
            <Checkbox id="closed" name="closed" value="1" defaultChecked={current.closed === "1"} />
            <Label htmlFor="closed" className="text-xs font-normal">
              Include closed
            </Label>
          </div>

          <Button type="submit" size="sm">
            Apply
          </Button>
          <Button variant="ghost" size="sm" render={<Link href={`/prospects?cols=${group}`}>Reset</Link>} />
        </div>
      </form>
    </div>
  );
}

function Picker({
  name,
  label,
  placeholder,
  value,
  options,
}: {
  name: string;
  label: string;
  placeholder: string;
  value?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="w-40 space-y-1.5">
      <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Select
        name={name}
        defaultValue={value}
        items={Object.fromEntries(options.map((o) => [o.value, o.label]))}
      >
        <SelectTrigger className="w-full bg-background">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Threshold({
  name,
  label,
  value,
  placeholder,
}: {
  name: string;
  label: string;
  value?: string;
  placeholder: string;
}) {
  return (
    <div className="w-36 space-y-1.5">
      <Label
        htmlFor={name}
        className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type="number"
        step="any"
        defaultValue={value ?? ""}
        placeholder={placeholder}
        className="bg-background"
      />
    </div>
  );
}
