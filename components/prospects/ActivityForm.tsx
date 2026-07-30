import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTIVITY_TYPE_OPTIONS } from "@/lib/validations/activity";

type Option = { id: string; name: string };

export function ActivityForm({
  action,
  users,
  defaultContactedById,
}: {
  action: (formData: FormData) => void;
  users: Option[];
  defaultContactedById?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="max-w-2xl space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="activityType">Type</Label>
          <Select name="activityType" defaultValue="EMAIL">
            <SelectTrigger id="activityType" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="activityDate">Date</Label>
          <Input id="activityDate" name="activityDate" type="date" defaultValue={today} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactedById">Team member</Label>
          <Select name="contactedById" defaultValue={defaultContactedById}>
            <SelectTrigger id="contactedById" className="w-full">
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
        <div className="space-y-1.5">
          <Label htmlFor="contactPersonName">Prospect contact</Label>
          <Input id="contactPersonName" name="contactPersonName" placeholder="Who was contacted" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="resultedInResponse" name="resultedInResponse" />
        <Label htmlFor="resultedInResponse" className="font-normal">
          Resulted in a response
        </Label>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="outcomeNotes">Outcome</Label>
        <Textarea id="outcomeNotes" name="outcomeNotes" rows={2} />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="followUpRequired" name="followUpRequired" />
        <Label htmlFor="followUpRequired" className="font-normal">
          Follow-up required
        </Label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="followUpDate">Follow-up date</Label>
          <Input id="followUpDate" name="followUpDate" type="date" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="followUpNotes">Follow-up notes</Label>
          <Input id="followUpNotes" name="followUpNotes" />
        </div>
      </div>

      <Button type="submit" size="sm">
        Log activity
      </Button>
    </form>
  );
}
