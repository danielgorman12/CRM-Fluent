import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const FIELDS = [
  { key: "whyCompanyAttractive", label: "Why is the company attractive?" },
  { key: "whyVerticalAttractive", label: "Why is the vertical attractive?" },
  { key: "synergies", label: "Potential synergies" },
  { key: "keyRisks", label: "Key risks" },
  { key: "whyOwnerMightSell", label: "Why might the owner sell?" },
  { key: "whyNow", label: "Why now?" },
  { key: "recommendedNextAction", label: "Recommended next action" },
] as const;

type ThesisValues = Partial<Record<(typeof FIELDS)[number]["key"], string | null>>;

export function ThesisForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  defaultValues?: ThesisValues;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-5">
      {FIELDS.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <Label htmlFor={field.key}>{field.label}</Label>
          <Textarea id={field.key} name={field.key} rows={3} defaultValue={defaultValues?.[field.key] ?? ""} />
        </div>
      ))}
      <Button type="submit">Save thesis</Button>
    </form>
  );
}
