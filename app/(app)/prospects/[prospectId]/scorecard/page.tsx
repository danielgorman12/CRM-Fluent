import { prisma } from "@/lib/prisma";
import { upsertScorecard } from "@/actions/scorecard-actions";
import { ScorecardForm } from "@/components/prospects/ScorecardForm";
import { SCORECARD_FACTORS } from "@/lib/validations/scorecard";

export default async function ScorecardTab({
  params,
}: {
  params: Promise<{ prospectId: string }>;
}) {
  const { prospectId } = await params;
  const scorecard = await prisma.scorecard.findUnique({ where: { prospectId } });
  const action = upsertScorecard.bind(null, prospectId);

  return (
    <div className="space-y-8">
      {scorecard && (
        <div>
          <div className="mb-3 flex items-baseline gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">Overall score</h2>
            <span className="text-2xl font-semibold">{scorecard.overallScore.toString()}</span>
            <span className="text-sm text-muted-foreground">/ 10</span>
          </div>
          <dl className="grid max-w-2xl grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
            {SCORECARD_FACTORS.map((factor) => (
              <div key={factor.key}>
                <dt className="text-muted-foreground">{factor.label}</dt>
                <dd className="font-medium">{String(scorecard[factor.key as keyof typeof scorecard])} / 10</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          {scorecard ? "Update scorecard" : "Score this prospect"}
        </h2>
        <ScorecardForm action={action} defaultValues={scorecard ?? undefined} />
      </div>
    </div>
  );
}
