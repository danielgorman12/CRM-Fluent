import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SCORECARD_FACTORS } from "@/lib/validations/scorecard";

type ScorecardValues = Record<string, unknown>;

export function ScorecardForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  defaultValues?: ScorecardValues;
}) {
  return (
    <form action={action} className="max-w-3xl space-y-6">
      <div className="space-y-5">
        {SCORECARD_FACTORS.map((factor) => (
          <div key={factor.key} className="grid grid-cols-[1fr_5rem] gap-4 sm:grid-cols-[1fr_5rem_2fr]">
            <div className="space-y-1.5 self-end">
              <Label htmlFor={factor.key}>{factor.label}</Label>
            </div>
            <div className="space-y-1.5">
              <Input
                id={factor.key}
                name={factor.key}
                type="number"
                min={1}
                max={10}
                required
                defaultValue={(defaultValues?.[factor.key] as number | string | undefined) ?? undefined}
              />
            </div>
            <div className="space-y-1.5 sm:col-start-3">
              <Textarea
                id={factor.notesKey}
                name={factor.notesKey}
                placeholder="Notes"
                rows={1}
                defaultValue={(defaultValues?.[factor.notesKey] as string | undefined) ?? ""}
              />
            </div>
          </div>
        ))}
      </div>
      <Button type="submit">Save scorecard</Button>
    </form>
  );
}
