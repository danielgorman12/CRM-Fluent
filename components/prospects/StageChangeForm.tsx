import { changeProspectStage } from "@/actions/stage-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Stage = { id: string; name: string };

export function StageChangeForm({
  prospectId,
  currentStageId,
  stages,
}: {
  prospectId: string;
  currentStageId: string;
  stages: Stage[];
}) {
  async function action(formData: FormData) {
    "use server";
    const newStageId = formData.get("stageId") as string;
    const notes = (formData.get("notes") as string) || undefined;
    if (newStageId && newStageId !== currentStageId) {
      await changeProspectStage(prospectId, newStageId, notes);
    }
  }

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <div className="w-56 space-y-1.5">
        <label className="text-xs text-muted-foreground" htmlFor="stageId">
          Move to stage
        </label>
        <Select name="stageId" defaultValue={currentStageId}>
          <SelectTrigger id="stageId" className="w-full">
            <SelectValue />
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
      <div className="flex-1 space-y-1.5">
        <label className="text-xs text-muted-foreground" htmlFor="notes">
          Note (optional)
        </label>
        <Input id="notes" name="notes" placeholder="Why the stage changed" />
      </div>
      <Button type="submit" size="sm">
        Update stage
      </Button>
    </form>
  );
}
