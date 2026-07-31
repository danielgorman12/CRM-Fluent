// Outreach templates use {{field}} merge tags, filled per recipient.
//
// Note on sending: this records outreach in the CRM but does not transmit
// email. No mail provider is wired up, deliberately — sending real mail to real
// companies needs an explicit decision about provider, domain authentication
// and consent. Marking a campaign sent snapshots the merged content and writes
// an EMAIL activity against each prospect, which is what the funnel measures.

export const MERGE_FIELDS = [
  { tag: "company", label: "Company name" },
  { tag: "owner", label: "Owner / contact" },
  { tag: "vertical", label: "Vertical" },
  { tag: "city", label: "City" },
  { tag: "country", label: "Country" },
  { tag: "stage", label: "Current stage" },
  { tag: "sender", label: "Your name" },
] as const;

export type MergeContext = {
  company: string;
  owner: string;
  vertical: string;
  city: string;
  country: string;
  stage: string;
  sender: string;
};

export function renderTemplate(template: string, context: MergeContext): string {
  // Unknown tags are left as-is rather than silently blanked, so a typo is
  // visible in the preview instead of producing a gap in the sent email.
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, tag: string) => {
    const value = (context as Record<string, string | undefined>)[tag];
    return value === undefined ? match : value;
  });
}

export function unresolvedTags(template: string): string[] {
  const known = new Set(MERGE_FIELDS.map((f) => f.tag));
  const found = [...template.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]);
  return [...new Set(found.filter((tag) => !known.has(tag as never)))];
}

export const DEFAULT_SUBJECT = "Exploring a conversation with {{company}}";

export const DEFAULT_BODY = `Hi {{owner}},

I lead software acquisitions at Fluent Software Group. We acquire and hold vertical market software businesses long term — we're not a fund, so we don't have an exit timeline.

{{company}} stood out to us in {{vertical}}: a focused product with a loyal customer base is exactly the kind of business we look to partner with.

I'm not asking you to run a process. If you're ever curious what a transition could look like — for you, your team and your customers — I'd welcome a short, confidential conversation.

Would you be open to a 20-minute call in the next few weeks?

Best regards,
{{sender}}
Fluent Software Group`;
