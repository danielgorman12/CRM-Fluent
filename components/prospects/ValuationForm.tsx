import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type ValuationValues = Record<string, unknown>;

export function ValuationForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  defaultValues?: ValuationValues;
}) {
  const val = (key: string) => (defaultValues?.[key] as number | string | undefined) ?? "";

  return (
    <form action={action} className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="indicativePriceRangeLow">Indicative price range — low (USD)</Label>
          <Input id="indicativePriceRangeLow" name="indicativePriceRangeLow" type="number" step="any" defaultValue={val("indicativePriceRangeLow")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="indicativePriceRangeHigh">Indicative price range — high (USD)</Label>
          <Input id="indicativePriceRangeHigh" name="indicativePriceRangeHigh" type="number" step="any" defaultValue={val("indicativePriceRangeHigh")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="revenueMultipleLow">Revenue multiple — low</Label>
          <Input id="revenueMultipleLow" name="revenueMultipleLow" type="number" step="any" defaultValue={val("revenueMultipleLow")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="revenueMultipleHigh">Revenue multiple — high</Label>
          <Input id="revenueMultipleHigh" name="revenueMultipleHigh" type="number" step="any" defaultValue={val("revenueMultipleHigh")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ebitdaMultipleLow">EBITDA multiple — low</Label>
          <Input id="ebitdaMultipleLow" name="ebitdaMultipleLow" type="number" step="any" defaultValue={val("ebitdaMultipleLow")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ebitdaMultipleHigh">EBITDA multiple — high</Label>
          <Input id="ebitdaMultipleHigh" name="ebitdaMultipleHigh" type="number" step="any" defaultValue={val("ebitdaMultipleHigh")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="forecastedPurchasePrice">Forecasted purchase price (USD)</Label>
          <Input id="forecastedPurchasePrice" name="forecastedPurchasePrice" type="number" step="any" defaultValue={val("forecastedPurchasePrice")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expectedROCE">Expected ROCE (%)</Label>
          <Input id="expectedROCE" name="expectedROCE" type="number" step="any" defaultValue={val("expectedROCE")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="valuationNotes">Valuation notes</Label>
          <Textarea id="valuationNotes" name="valuationNotes" rows={3} defaultValue={(defaultValues?.valuationNotes as string) ?? ""} />
        </div>
      </div>
      <Button type="submit">Save valuation</Button>
    </form>
  );
}
