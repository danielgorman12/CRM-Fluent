import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function OutreachPage() {
  const campaigns = await prisma.campaign.findMany({
    include: { createdBy: true, _count: { select: { recipients: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Outreach</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Email campaigns to single companies or groups, built from a geographic selection.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/map">Select from map</Link>} />
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm font-medium">No campaigns yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open the{" "}
            <Link href="/map" className="underline underline-offset-2">
              geographic map
            </Link>
            , filter to a region, pick the companies you want and draft outreach.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {campaigns.map((campaign) => (
            <li key={campaign.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
              <Link href={`/outreach/${campaign.id}`} className="text-sm font-medium hover:underline">
                {campaign.name}
              </Link>
              <Badge variant={campaign.status === "SENT" ? "default" : "secondary"}>
                {campaign.status === "SENT" ? "Sent" : "Draft"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {campaign._count.recipients}{" "}
                {campaign._count.recipients === 1 ? "recipient" : "recipients"}
              </span>
              {campaign.geographyNote && (
                <span className="text-xs text-muted-foreground">{campaign.geographyNote}</span>
              )}
              <span className="ml-auto text-xs text-muted-foreground">
                {campaign.sentAt
                  ? `Sent ${campaign.sentAt.toLocaleDateString()}`
                  : `Updated ${campaign.updatedAt.toLocaleDateString()}`}{" "}
                · {campaign.createdBy.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
