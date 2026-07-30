import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { upsertForecast } from "@/actions/forecast-actions";
import { ForecastForm } from "@/components/prospects/ForecastForm";

export default async function ForecastTab({
  params,
}: {
  params: Promise<{ prospectId: string }>;
}) {
  const { prospectId } = await params;
  const [forecast, valuation] = await Promise.all([
    prisma.prospectForecast.findUnique({ where: { prospectId } }),
    prisma.valuationAnalysis.findUnique({ where: { prospectId } }),
  ]);
  const action = upsertForecast.bind(null, prospectId);

  return (
    <div className="space-y-8">
      <div className="max-w-2xl rounded-lg border bg-muted/30 p-4 text-sm">
        <p className="mb-2 text-muted-foreground">
          Forecasted purchase price and expected ROCE are set on the{" "}
          <Link href={`/prospects/${prospectId}/valuation`} className="underline underline-offset-2">
            Valuation
          </Link>{" "}
          tab and shown here for context.
        </p>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-muted-foreground">Forecasted purchase price</dt>
            <dd className="font-medium">
              {valuation?.forecastedPurchasePrice ? `$${Number(valuation.forecastedPurchasePrice).toLocaleString()}` : "Not yet set"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Expected ROCE</dt>
            <dd className="font-medium">
              {valuation?.expectedROCE ? `${Number(valuation.expectedROCE).toLocaleString()}%` : "Not yet set"}
            </dd>
          </div>
        </dl>
      </div>

      <ForecastForm action={action} defaultValues={forecast ?? undefined} />
    </div>
  );
}
