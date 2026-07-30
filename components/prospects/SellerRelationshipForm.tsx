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
import { SUCCESSION_TIMELINE_OPTIONS, SUCCESSOR_STATUS_OPTIONS } from "@/lib/validations/seller";

type SellerValues = Record<string, unknown>;

export function SellerRelationshipForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  defaultValues?: SellerValues;
}) {
  const str = (key: string) => (defaultValues?.[key] as string | undefined) ?? "";
  const num = (key: string) => (defaultValues?.[key] as number | string | undefined) ?? "";

  return (
    <form action={action} className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ownerName">Owner name</Label>
          <Input id="ownerName" name="ownerName" defaultValue={str("ownerName")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ownerAge">Owner age</Label>
          <Input id="ownerAge" name="ownerAge" type="number" defaultValue={num("ownerAge")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="yearsOwned">Years owned</Label>
          <Input id="yearsOwned" name="yearsOwned" type="number" defaultValue={num("yearsOwned")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expectedSuccessionTimeline">Expected succession timeline</Label>
          <Select name="expectedSuccessionTimeline" defaultValue={str("expectedSuccessionTimeline") || undefined}>
            <SelectTrigger id="expectedSuccessionTimeline" className="w-full">
              <SelectValue placeholder="Select a timeline" />
            </SelectTrigger>
            <SelectContent>
              {SUCCESSION_TIMELINE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="successorIdentified">Successor status</Label>
          <Select name="successorIdentified" defaultValue={str("successorIdentified") || undefined}>
            <SelectTrigger id="successorIdentified" className="w-full">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              {SUCCESSOR_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sellerPriceExpectationLow">Price expectation low (USD)</Label>
          <Input id="sellerPriceExpectationLow" name="sellerPriceExpectationLow" type="number" defaultValue={num("sellerPriceExpectationLow")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sellerPriceExpectationHigh">Price expectation high (USD)</Label>
          <Input id="sellerPriceExpectationHigh" name="sellerPriceExpectationHigh" type="number" defaultValue={num("sellerPriceExpectationHigh")} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ownershipChangeHistory">Ownership change history</Label>
          <Textarea id="ownershipChangeHistory" name="ownershipChangeHistory" rows={2} defaultValue={str("ownershipChangeHistory")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="sellerStatedObjectives">Seller&apos;s stated objectives</Label>
          <Textarea id="sellerStatedObjectives" name="sellerStatedObjectives" rows={2} defaultValue={str("sellerStatedObjectives")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="sellerWillingnessNotes">Seller willingness notes</Label>
          <Textarea id="sellerWillingnessNotes" name="sellerWillingnessNotes" rows={2} defaultValue={str("sellerWillingnessNotes")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="otherSuccessionSignals">Other succession signals</Label>
          <Textarea id="otherSuccessionSignals" name="otherSuccessionSignals" rows={2} defaultValue={str("otherSuccessionSignals")} />
        </div>
      </div>
      <Button type="submit">Save seller intelligence</Button>
    </form>
  );
}
