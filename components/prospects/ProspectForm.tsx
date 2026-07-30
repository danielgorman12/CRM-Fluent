import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { id: string; name: string };

export type ProspectFormValues = {
  name?: string | null;
  website?: string | null;
  description?: string | null;
  verticalId?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  currentARR?: number | string | null;
  currentEBITDA?: number | string | null;
  currentEBITDAMargin?: number | string | null;
  grossRetentionPct?: number | string | null;
  netRetentionPct?: number | string | null;
  customerRetentionNotes?: string | null;
  dealOwnerId?: string | null;
  currentStageId?: string | null;
};

export function ProspectForm({
  action,
  verticals,
  stages,
  users,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  verticals: Option[];
  stages: Option[];
  users: Option[];
  defaultValues?: ProspectFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="name">Company name</Label>
          <Input id="name" name="name" defaultValue={defaultValues?.name ?? ""} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" type="url" defaultValue={defaultValues?.website ?? ""} placeholder="https://" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="verticalId">Vertical</Label>
          <Select name="verticalId" defaultValue={defaultValues?.verticalId ?? undefined}>
            <SelectTrigger id="verticalId" className="w-full">
              <SelectValue placeholder="Select a vertical" />
            </SelectTrigger>
            <SelectContent>
              {verticals.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" defaultValue={defaultValues?.description ?? ""} rows={3} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={defaultValues?.city ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="region">State / Region</Label>
          <Input id="region" name="region" defaultValue={defaultValues?.region ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" defaultValue={defaultValues?.country ?? ""} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="currentARR">Current ARR (USD)</Label>
          <Input id="currentARR" name="currentARR" type="number" step="any" defaultValue={defaultValues?.currentARR ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currentEBITDA">Current EBITDA (USD)</Label>
          <Input id="currentEBITDA" name="currentEBITDA" type="number" step="any" defaultValue={defaultValues?.currentEBITDA ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currentEBITDAMargin">EBITDA margin (%)</Label>
          <Input id="currentEBITDAMargin" name="currentEBITDAMargin" type="number" step="any" defaultValue={defaultValues?.currentEBITDAMargin ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="grossRetentionPct">Gross retention (%)</Label>
          <Input id="grossRetentionPct" name="grossRetentionPct" type="number" step="any" defaultValue={defaultValues?.grossRetentionPct ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="netRetentionPct">Net retention (%)</Label>
          <Input id="netRetentionPct" name="netRetentionPct" type="number" step="any" defaultValue={defaultValues?.netRetentionPct ?? ""} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="customerRetentionNotes">Customer retention notes</Label>
          <Textarea id="customerRetentionNotes" name="customerRetentionNotes" defaultValue={defaultValues?.customerRetentionNotes ?? ""} rows={2} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dealOwnerId">Deal owner</Label>
          <Select name="dealOwnerId" defaultValue={defaultValues?.dealOwnerId ?? undefined} required>
            <SelectTrigger id="dealOwnerId" className="w-full">
              <SelectValue placeholder="Select a team member" />
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

        {!defaultValues && (
          <div className="space-y-1.5">
            <Label htmlFor="currentStageId">Initial stage</Label>
            <Select name="currentStageId" required>
              <SelectTrigger id="currentStageId" className="w-full">
                <SelectValue placeholder="Select a stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
