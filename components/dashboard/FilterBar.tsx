import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PERIOD_OPTIONS } from "@/lib/dashboard-queries";
import { ACTIVITY_TYPE_OPTIONS } from "@/lib/validations/activity";

type Option = { id: string; name: string };
type Choice = { value: string; label: string };

export function FilterBar({
  countries,
  verticals,
  users,
  stages,
  current,
}: {
  countries: string[];
  verticals: Option[];
  users: Option[];
  stages: Option[];
  current: Record<string, string | undefined>;
}) {
  const asChoices = (options: Option[]): Choice[] =>
    options.map((o) => ({ value: o.id, label: o.name }));

  return (
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl bg-muted/40 p-4">
      <FilterSelect
        name="period"
        label="Period"
        placeholder="All time"
        value={current.period}
        choices={PERIOD_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
      />
      <FilterSelect
        name="country"
        label="Geography"
        placeholder="All countries"
        value={current.country}
        choices={countries.map((c) => ({ value: c, label: c }))}
      />
      <FilterSelect
        name="verticalId"
        label="Vertical"
        placeholder="All verticals"
        value={current.verticalId}
        choices={asChoices(verticals)}
      />
      <FilterSelect
        name="dealOwnerId"
        label="Team member"
        placeholder="Everyone"
        value={current.dealOwnerId}
        choices={asChoices(users)}
      />
      <FilterSelect
        name="activityType"
        label="Outreach method"
        placeholder="All methods"
        value={current.activityType}
        choices={ACTIVITY_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
      />
      <FilterSelect
        name="stageId"
        label="Current stage"
        placeholder="Any stage"
        value={current.stageId}
        choices={asChoices(stages)}
      />

      <Button type="submit" size="sm">
        Apply
      </Button>
      <Button variant="ghost" size="sm" render={<a href="/dashboard">Clear</a>} />
    </form>
  );
}

function FilterSelect({
  name,
  label,
  placeholder,
  value,
  choices,
}: {
  name: string;
  label: string;
  placeholder: string;
  value?: string;
  choices: Choice[];
}) {
  // Base UI renders the raw value unless given an items map, which showed
  // "90" instead of "Last 90 days" on the period filter.
  const items = Object.fromEntries(choices.map((c) => [c.value, c.label]));

  return (
    <div className="w-40 space-y-1.5">
      <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <Select name={name} defaultValue={value} items={items}>
        <SelectTrigger className="w-full bg-background">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {choices.map((choice) => (
            <SelectItem key={choice.value} value={choice.value}>
              {choice.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
