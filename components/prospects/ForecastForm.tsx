import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type ForecastValues = Record<string, unknown>;

export function ForecastForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  defaultValues?: ForecastValues;
}) {
  const val = (key: string) => (defaultValues?.[key] as number | string | undefined) ?? "";

  return (
    <form action={action} className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="forecastedRevenueGrowthPct">Forecasted revenue/ARR growth (%)</Label>
          <Input id="forecastedRevenueGrowthPct" name="forecastedRevenueGrowthPct" type="number" step="any" defaultValue={val("forecastedRevenueGrowthPct")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="horizonYears">Forecast horizon (years)</Label>
          <Input id="horizonYears" name="horizonYears" type="number" defaultValue={val("horizonYears")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="forecastedARR">Forecasted ARR (USD)</Label>
          <Input id="forecastedARR" name="forecastedARR" type="number" step="any" defaultValue={val("forecastedARR")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="forecastedEBITDA">Forecasted EBITDA (USD)</Label>
          <Input id="forecastedEBITDA" name="forecastedEBITDA" type="number" step="any" defaultValue={val("forecastedEBITDA")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="forecastedEBITDAMargin">Forecasted EBITDA margin (%)</Label>
          <Input id="forecastedEBITDAMargin" name="forecastedEBITDAMargin" type="number" step="any" defaultValue={val("forecastedEBITDAMargin")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="marginImprovementPts">Margin improvement opportunity (pts)</Label>
          <Input id="marginImprovementPts" name="marginImprovementPts" type="number" step="any" defaultValue={val("marginImprovementPts")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="marginImprovementOpportunity">Margin improvement opportunity — notes</Label>
          <Textarea id="marginImprovementOpportunity" name="marginImprovementOpportunity" rows={2} defaultValue={(defaultValues?.marginImprovementOpportunity as string) ?? ""} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="keyAssumptions">Key assumptions</Label>
          <Textarea id="keyAssumptions" name="keyAssumptions" rows={3} defaultValue={(defaultValues?.keyAssumptions as string) ?? ""} />
        </div>
      </div>
      <Button type="submit">Save forecast</Button>
    </form>
  );
}
