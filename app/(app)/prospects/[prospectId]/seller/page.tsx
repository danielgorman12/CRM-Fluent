import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { upsertSellerRelationship } from "@/actions/seller-actions";
import { SellerRelationshipForm } from "@/components/prospects/SellerRelationshipForm";

export default async function SellerTab({
  params,
}: {
  params: Promise<{ prospectId: string }>;
}) {
  const { prospectId } = await params;
  const [seller, recentActivity] = await Promise.all([
    prisma.sellerRelationship.findUnique({ where: { prospectId } }),
    prisma.sourcingActivity.findMany({
      where: { prospectId },
      include: { contactedBy: true },
      orderBy: { activityDate: "desc" },
      take: 3,
    }),
  ]);
  const action = upsertSellerRelationship.bind(null, prospectId);

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Previous discussions</h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No outreach logged yet — see the{" "}
            <Link href={`/prospects/${prospectId}/activity`} className="underline underline-offset-2">
              Activity
            </Link>{" "}
            tab.
          </p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {recentActivity.map((a) => (
              <li key={a.id} className="text-muted-foreground">
                {a.activityDate.toLocaleDateString()} — {a.activityType.toLowerCase()} by {a.contactedBy.name}
                {a.outcomeNotes ? `: ${a.outcomeNotes}` : ""}
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/prospects/${prospectId}/activity`}
          className="mt-1 inline-block text-sm underline underline-offset-2"
        >
          View full activity history
        </Link>
      </div>

      <SellerRelationshipForm action={action} defaultValues={seller ?? undefined} />
    </div>
  );
}
