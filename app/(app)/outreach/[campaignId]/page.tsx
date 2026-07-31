import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  MERGE_FIELDS,
  renderTemplate,
  unresolvedTags,
  type MergeContext,
} from "@/lib/outreach";
import {
  deleteCampaign,
  markCampaignSent,
  removeRecipient,
  updateCampaign,
} from "@/actions/campaign-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StageBadge } from "@/components/prospects/StageBadge";

export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { campaignId } = await params;
  const sp = await searchParams;
  const previewId = typeof sp.preview === "string" ? sp.preview : undefined;

  const [campaign, session] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        createdBy: true,
        recipients: {
          include: {
            prospect: {
              include: { sellerRelationship: true, vertical: true, currentStage: true },
            },
          },
          orderBy: { prospect: { name: "asc" } },
        },
      },
    }),
    auth(),
  ]);

  if (!campaign) notFound();

  const isSent = campaign.status === "SENT";
  const previewRecipient =
    campaign.recipients.find((r) => r.id === previewId) ?? campaign.recipients[0];

  const previewContext: MergeContext | null = previewRecipient
    ? {
        company: previewRecipient.prospect.name,
        owner: previewRecipient.prospect.sellerRelationship?.ownerName ?? "there",
        vertical: previewRecipient.prospect.vertical?.name ?? "vertical market software",
        city: previewRecipient.prospect.city ?? "",
        country: previewRecipient.prospect.country ?? "",
        stage: previewRecipient.prospect.currentStage.name,
        sender: session?.user?.name ?? "",
      }
    : null;

  const badTags = unresolvedTags(`${campaign.subject}\n${campaign.body}`);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/outreach" className="text-xs text-muted-foreground underline underline-offset-2">
            ← Outreach
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
            <Badge variant={isSent ? "default" : "secondary"}>{isSent ? "Sent" : "Draft"}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {campaign.recipients.length}{" "}
            {campaign.recipients.length === 1 ? "recipient" : "recipients"}
            {campaign.geographyNote ? ` · ${campaign.geographyNote}` : ""}
            {campaign.sentAt ? ` · sent ${campaign.sentAt.toLocaleString()}` : ""}
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await deleteCampaign(campaignId);
          }}
        >
          <Button type="submit" variant="destructive" size="sm">
            Delete campaign
          </Button>
        </form>
      </div>

      {/* Sending is recorded in the CRM but no mail is transmitted — say so
          plainly rather than implying email left the building. */}
      <div className="flex items-start gap-2.5 rounded-xl border border-dashed px-4 py-3">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          No mail provider is connected. Marking a campaign sent records the merged email against
          each prospect&apos;s activity log and updates the dashboard, but does not deliver
          anything. Wiring a real sender is a separate step.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          {isSent ? (
            <section className="space-y-3 rounded-xl border p-4">
              <h2 className="text-sm font-semibold">Sent content</h2>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Subject
                </p>
                <p className="text-sm">{campaign.subject}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Body
                </p>
                <p className="whitespace-pre-line text-sm">{campaign.body}</p>
              </div>
            </section>
          ) : (
            <form action={updateCampaign.bind(null, campaignId)} className="space-y-4 rounded-xl border p-4">
              <h2 className="text-sm font-semibold">Draft</h2>

              <div className="space-y-1.5">
                <Label htmlFor="name">Campaign name</Label>
                <Input id="name" name="name" defaultValue={campaign.name} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" defaultValue={campaign.subject} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="body">Body</Label>
                <Textarea id="body" name="body" rows={16} defaultValue={campaign.body} />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Merge fields:</span>
                {MERGE_FIELDS.map((field) => (
                  <code
                    key={field.tag}
                    title={field.label}
                    className="rounded bg-muted px-1.5 py-0.5 text-[11px]"
                  >
                    {`{{${field.tag}}}`}
                  </code>
                ))}
              </div>

              {badTags.length > 0 && (
                <p className="text-xs text-negative">
                  Unknown merge field{badTags.length > 1 ? "s" : ""}: {badTags.join(", ")} — these
                  will be sent literally.
                </p>
              )}

              <Button type="submit" size="sm">
                Save draft
              </Button>
            </form>
          )}

          {previewContext && previewRecipient && (
            <section className="space-y-3 rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Preview</h2>
                <span className="text-xs text-muted-foreground">
                  as sent to {previewRecipient.prospect.name}
                </span>
              </div>
              <div className="rounded-lg bg-muted/40 p-4">
                <p className="text-sm font-medium">
                  {renderTemplate(
                    previewRecipient.renderedSubject ?? campaign.subject,
                    previewContext,
                  )}
                </p>
                <hr className="my-3" />
                <p className="whitespace-pre-line text-sm">
                  {renderTemplate(previewRecipient.renderedBody ?? campaign.body, previewContext)}
                </p>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <section className="overflow-hidden rounded-xl border">
            <header className="flex items-center justify-between border-b px-4 py-2.5">
              <h2 className="text-sm font-semibold">Recipients</h2>
              <span className="text-xs text-muted-foreground">{campaign.recipients.length}</span>
            </header>
            {campaign.recipients.length === 0 ? (
              <p className="px-4 py-4 text-sm text-muted-foreground">
                All recipients removed.{" "}
                <Link href="/map" className="underline underline-offset-2">
                  Pick more from the map
                </Link>
                .
              </p>
            ) : (
              <ul className="max-h-96 divide-y overflow-y-auto">
                {campaign.recipients.map((recipient) => (
                  <li key={recipient.id} className="px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/prospects/${recipient.prospectId}`}
                          className="block truncate text-sm font-medium hover:underline"
                        >
                          {recipient.prospect.name}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <StageBadge
                            name={recipient.prospect.currentStage.name}
                            colorHex={recipient.prospect.currentStage.colorHex}
                          />
                          {recipient.sentAt && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-positive">
                              <CircleCheck className="size-3" />
                              logged
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">
                          {recipient.prospect.sellerRelationship?.ownerName ?? "No contact recorded"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Link
                          href={`/outreach/${campaignId}?preview=${recipient.id}`}
                          className="text-[11px] underline underline-offset-2"
                        >
                          Preview
                        </Link>
                        {!isSent && (
                          <form
                            action={async () => {
                              "use server";
                              await removeRecipient(recipient.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
                            >
                              Remove
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!isSent && campaign.recipients.length > 0 && (
            <form
              action={async () => {
                "use server";
                await markCampaignSent(campaignId);
              }}
              className="space-y-2 rounded-xl border p-4"
            >
              <p className="text-xs text-muted-foreground">
                Records this email against all {campaign.recipients.length} prospects and locks the
                draft.
              </p>
              <Button type="submit" size="sm" className="w-full">
                Mark as sent &amp; log activity
              </Button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
