# Demo Script

**Target runtime:** 8–10 minutes
**Status:** Phase 0 draft — rehearse and time in Phase 8

## Opening line

> "Traditional CRMs tell an M&A team which companies are in their database. This one tells them **where to focus**, **who to visit**, and **how to structure the trip**."

Do not open on the company table. Open on the problem: a VMS acquisition team with 48 prospects across six countries and a limited travel budget.

---

## Act 1 — From a list to a geography (≈2 min)

| # | Action | Say |
|---|---|---|
| 1 | Open **Sourcing** | "This is the underlying database — 48 VMS prospects. It exists to feed everything else." |
| 2 | Filter: Industry = Healthcare IT + Education, Employees 20–150, Stage = Positive Response + Data Received + Touch Base Later | "Our sourcing criteria this quarter." |
| 3 | Point at the URL | "The filter lives in the URL. Every other section reads the same filter model — there's one filtering implementation, not four." |
| 4 | Click **Apply to Map** | |

**Watch for:** the result count must be non-trivial (target 18–24 companies) — verify against seed data in Phase 8.

---

## Act 2 — Geographic intelligence (≈3 min)

| # | Action | Say |
|---|---|---|
| 5 | Map loads with the filtered set | "Same companies, now as geography. Colour is opportunity stage." |
| 6 | Point at the data-quality strip | "34 precisely mapped, 8 approximate, 3 need review, 3 unmapped. We never treat an approximate location as precise — it changes how the trip agent treats them." |
| 7 | Open the **geographic report** | "Concentration, stage distribution, industry mix — all computed in code. No model is asked to count anything." |
| 8 | Scroll to **opportunity clusters** | "This is the answer to 'where should we go'. Chicago metro: 9 prospects, 4 due for follow-up, estimated 7 viable meetings, recommended 2 days." |
| 9 | Expand a cluster's priority breakdown | "Never a bare score — viable meetings, stage quality, follow-up urgency, and compactness, each shown." |
| 10 | Show **follow-up analysis** | "Six overdue, four due this month. That's what makes a trip urgent rather than optional." |
| 11 | Show **whitespace**, point at the Interpretation badge | "Interpretations are badged separately from facts. We only claim what the CRM data supports." |

---

## Act 3 — The sourcing-trip agent (≈4 min)

| # | Action | Say |
|---|---|---|
| 12 | Select the **Chicago cluster** → **Plan a sourcing trip** | "The cluster becomes the candidate set." |
| 13 | Set 2 days, 4 meetings/day, 75-min meetings, 75 km radius → Generate | |
| 14 | Show **ranked companies** | "Every company carries a six-factor breakdown. Northwind scores 86: full geographic fit, in-person meeting two months ago, follow-up 12 days overdue." |
| 15 | Show the **day-by-day itinerary** | "Real clock times, travel between stops, 20-minute buffers, lunch blocked." |
| 16 | Point at a travel figure | "Labelled as an estimate — straight-line distance with a detour factor. We're not pretending to have traffic data." |
| 17 | Show **pre-trip actions** | "Three of these have never been contacted. The agent says: send outreach before you book the flight." |
| 18 | Show **exclusions** | "Meridian was excluded — Closed Lost. Two more fell outside the radius, and it tells you exactly what to change to include them." |
| 19 | **Remove one company**, regenerate | "The schedule rebuilds around it. Manual pins survive regeneration." |

**Scenario 3 — the honesty moment (do not skip).**

| # | Action | Say |
|---|---|---|
| 20 | Ask for a trip around **Tromsø** | "This is the test that matters. There are two prospects there." |
| 21 | Show the weak-trip verdict | "It doesn't invent a schedule. It says the geography is thin, names which criteria shrank the set, suggests expanding the radius, and points at a stronger region. An agent that always produces a confident itinerary is worse than useless." |

---

## Act 4 — The loop closes (≈1 min)

| # | Action | Say |
|---|---|---|
| 22 | Open a recommended company from the itinerary | "Full CRM history — call notes, stages, activity." |
| 23 | Add a call note; move the stage to Positive Response | |
| 24 | Return to the Map | "Marker colour changed, stage distribution changed, relationship score changed." |
| 25 | Regenerate the trip | "And its trip priority moved. One dataset, three views, one filter model." |

## Closing line

> "The geography drives the decision. The CRM exists to make the geography trustworthy."

---

## Pre-demo checklist (Phase 8)

- [ ] `npm run build` succeeds; production server started
- [ ] Demo reset script run — data is in a known state
- [ ] Seeded dates are relative, so "overdue" and "due soon" are genuinely true today
- [ ] All three scenarios run once, live, on the demo machine
- [ ] Act 1 filter combination verified to return 18–24 companies
- [ ] `AUTH_DEMO_MODE=1` set; one-click sign-in verified (ADR-015)
- [ ] `AI_PROVIDER=none` — this build has no model calls at all (ADR-016), so nothing in the demo can depend on a key
- [ ] Browser zoom set; map tiles pre-warmed for Chicago, Toronto, London
- [ ] Second browser tab pre-loaded on the Sourcing list as a recovery path

## Fallback if something breaks live

- Map fails to render → drive the demo from the report tables; every metric is still clickable.
- Trip generation errors → open a saved trip from the previous run.

## Note on AI

This build makes **no model calls** (ADR-016 — no API key available). Every number and every sentence is deterministic. If asked during judging, this is a strength worth stating plainly: the spec forbids AI from computing distances, counts, clusters, scores, or feasibility, and the engine is designed so the deterministic output *is* the product rather than a fallback behind it. The provider abstraction and response schemas are in place for narrative polish to be added by setting one environment variable.
