// Granola meeting-notes integration.
//
// Granola has no public REST API to call from a server today, so this ships as
// a pluggable adapter: if GRANOLA_API_KEY and GRANOLA_API_URL are set the real
// endpoint is called, otherwise a demo generator produces plausible notes so
// the flow is exercisable end to end.
//
// The demo generator is deterministic per prospect — the same company always
// yields the same notes — so a sync is idempotent and a demo is repeatable.
// `isGranolaLive` is surfaced in the UI so nobody mistakes generated notes for
// real ones.

export const isGranolaLive = Boolean(process.env.GRANOLA_API_KEY && process.env.GRANOLA_API_URL);

export type GranolaNote = {
  externalId: string;
  title: string;
  meetingDate: Date;
  attendees: string;
  summary: string;
  actionItems: string;
};

type FetchArgs = {
  prospectId: string;
  prospectName: string;
  ownerName: string | null;
  vertical: string | null;
  stageName: string;
};

export async function fetchGranolaNotes(args: FetchArgs): Promise<GranolaNote[]> {
  if (isGranolaLive) return fetchFromGranolaApi(args);
  return demoNotes(args);
}

async function fetchFromGranolaApi(args: FetchArgs): Promise<GranolaNote[]> {
  const url = new URL("/v1/meetings", process.env.GRANOLA_API_URL);
  url.searchParams.set("q", args.prospectName);

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.GRANOLA_API_KEY}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return [];

    // Defensive mapping: treat the payload as unknown shape and skip anything
    // that doesn't carry the fields we need, rather than throwing mid-sync.
    const payload = (await res.json()) as { meetings?: unknown[] };
    const meetings = Array.isArray(payload.meetings) ? payload.meetings : [];

    return meetings.flatMap((raw) => {
      const m = raw as Record<string, unknown>;
      const id = typeof m.id === "string" ? m.id : null;
      const title = typeof m.title === "string" ? m.title : null;
      const date = typeof m.start_time === "string" ? new Date(m.start_time) : null;
      if (!id || !title || !date || Number.isNaN(date.getTime())) return [];

      return [
        {
          externalId: id,
          title,
          meetingDate: date,
          attendees: Array.isArray(m.attendees) ? m.attendees.filter((a) => typeof a === "string").join(", ") : "",
          summary: typeof m.summary === "string" ? m.summary : "",
          actionItems: Array.isArray(m.action_items)
            ? m.action_items.filter((a) => typeof a === "string").join("\n")
            : "",
        },
      ];
    });
  } catch {
    // A provider outage shouldn't break the prospect page.
    return [];
  }
}

// --- Demo generator ---------------------------------------------------------

/** Stable hash so a given prospect always produces the same notes. */
function seedFrom(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) % 100_000;
  }
  return h;
}

function daysAgo(days: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

const SUMMARY_TEMPLATES = [
  (a: FetchArgs) =>
    `Intro call with ${a.ownerName ?? "the owner"}. Walked through how ${a.prospectName} is positioned in ${a.vertical ?? "its vertical"} and what a partnership could look like. Confirmed the business is majority owner-held with no outside investors. Owner was candid that inbound interest has picked up over the last year but they haven't run a process.`,
  (a: FetchArgs) =>
    `Follow-up on financials. ${a.ownerName ?? "The owner"} shared that recurring maintenance is billed annually in advance, which explains the deferred revenue balance. Churn is concentrated in the smallest customer tier; the top 20 accounts have been stable for years. Agreed to send a data request covering monthly revenue by customer.`,
  (a: FetchArgs) =>
    `Product and team discussion for ${a.prospectName}. Two developers hold most of the domain knowledge; no formal documentation. Owner is not looking to stay on beyond a transition period of six to twelve months. Raised valuation expectations informally — anchored on a revenue multiple rather than EBITDA.`,
  (a: FetchArgs) =>
    `Diligence planning call. Reviewed the outstanding items on the data request and agreed a timeline. ${a.ownerName ?? "The owner"} flagged one customer contract with an assignment clause that will need consent. Legal to review before we move to LOI.`,
];

const ACTION_TEMPLATES = [
  "Send NDA for signature\nShare indicative valuation range\nSchedule follow-up in two weeks",
  "Request monthly revenue by customer (36 months)\nAsk for employee roster with roles and comp\nConfirm deferred revenue treatment",
  "Introduce owner to portfolio operating partner\nOutline transition-period expectations\nDraft preliminary synergy notes",
  "Ask counsel to review assignment clause\nConfirm diligence timeline with owner\nPrepare LOI draft for internal review",
];

function demoNotes(args: FetchArgs): GranolaNote[] {
  const seed = seedFrom(args.prospectId || args.prospectName);

  // Later-stage prospects have had more conversations, so the volume of notes
  // tracks how far along the deal is.
  const advanced = ["Advanced Discussions", "Pre-LOI", "LOI Submitted", "LOI Accepted", "Closed Won"];
  const early = ["Identified", "Outreach Sent"];
  const count = early.includes(args.stageName) ? 1 : advanced.includes(args.stageName) ? 3 : 2;

  return Array.from({ length: count }, (_, i) => {
    const templateIndex = (seed + i) % SUMMARY_TEMPLATES.length;
    // Most recent first: 14 days ago, then 45, then 80.
    const offset = [14, 45, 80][i] + (seed % 7);
    return {
      externalId: `demo-granola-${args.prospectId}-${i}`,
      title:
        i === 0
          ? `${args.prospectName} — management call`
          : `${args.prospectName} — follow-up ${i}`,
      meetingDate: daysAgo(offset, 10 + (seed % 6)),
      attendees: [args.ownerName, "Daniel Gorman"].filter(Boolean).join(", "),
      summary: SUMMARY_TEMPLATES[templateIndex](args),
      actionItems: ACTION_TEMPLATES[templateIndex],
    };
  });
}
