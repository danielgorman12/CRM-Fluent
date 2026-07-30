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
  return (
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
      <FilterSelect name="period" label="Period" defaultValue={current.period} placeholder="All time">
        {PERIOD_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </FilterSelect>

      <FilterSelect name="country" label="Geography" defaultValue={current.country} placeholder="All countries">
        {countries.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </FilterSelect>

      <FilterSelect name="verticalId" label="Vertical" defaultValue={current.verticalId} placeholder="All verticals">
        {verticals.map((v) => (
          <SelectItem key={v.id} value={v.id}>
            {v.name}
          </SelectItem>
        ))}
      </FilterSelect>

      <FilterSelect name="dealOwnerId" label="Team member" defaultValue={current.dealOwnerId} placeholder="Everyone">
        {users.map((u) => (
          <SelectItem key={u.id} value={u.id}>
            {u.name}
          </SelectItem>
        ))}
      </FilterSelect>

      <FilterSelect name="activityType" label="Outreach method" defaultValue={current.activityType} placeholder="All methods">
        {ACTIVITY_TYPE_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </FilterSelect>

      <FilterSelect name="stageId" label="Current stage" defaultValue={current.stageId} placeholder="Any stage">
        {stages.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </FilterSelect>

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
  defaultValue,
  placeholder,
  children,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-44 space-y-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}
