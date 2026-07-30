# Product Specification — Geography-First M&A Sourcing Platform

**Status:** Phase 0 draft, awaiting approval
**Last updated:** 2026-07-30

## 1. Positioning

> Traditional CRMs tell M&A teams which companies are in their database. This platform tells them **where to focus their sourcing efforts, which companies to visit, and how to structure a high-quality sourcing trip.**

The product serves Vertical Market Software (VMS) acquisition teams who source proprietary deals by travelling to meet founder-owners. The differentiator is the transformation of CRM records into **geographic sourcing strategy** and **practical travel plans**.

## 2. What "done" means

The build is successful only if a user can complete this loop unaided:

1. Filter the Sourcing list by industry, size, and stage.
2. Push those filters to the Map.
3. Read geographic concentration and stage distribution for the visible set.
4. Open a geographic report for a region.
5. Identify the strongest opportunity clusters and the companies due for follow-up.
6. Select a cluster and open the sourcing-trip agent.
7. Receive a realistic, explainable 2–3 day itinerary.
8. Understand why each company was included and why others were excluded.
9. Change parameters, regenerate, and get a better trip.
10. Open a recommended company, log a call note or stage change, and see it flow back into the geography and trip context.

A polished company table with a weak trip agent is a **failed** implementation. A polished Pipeline with weak geographic intelligence is a **failed** implementation.

## 3. Priority order (governs all trade-offs)

| # | Area | Rationale |
|---|---|---|
| 1 | Geographic intelligence | The core deliverable. Reports must be credible and scannable. |
| 2 | Sourcing-trip agent | The second core deliverable. Must be realistic and explainable. |
| 3 | Sourcing data quality | Feeds 1 and 2. Bad location data invalidates everything above. |
| 4 | Company workflow | Profiles, notes, follow-ups — supporting context. |
| 5 | Pipeline | Supporting. Demo-sufficient only. |

**Rule:** do not start a Should-Have while a Priority 1 or 2 Must-Have is incomplete.

## 4. Application structure

Three primary sections, one shared company dataset, one shared filter model.

```
/sourcing            Company list, search, sort, filters, inline stage/owner edit
/sourcing/[id]       Company profile: info, location, opportunity, call notes, general notes, activity
/map                 Interactive map + geographic reports + trip agent  ← primary decision surface
/pipeline            Kanban across Data Received / IOI / LOI / DD
```

The Map section is **not** a marker view. It is the decision-making surface and hosts:
interactive map · geographic filters · geographic sourcing reports · concentration analysis ·
market prioritisation · opportunity clusters · whitespace analysis · the sourcing-trip agent ·
generated itineraries.

## 5. Cross-section consistency contract

All three sections read and write the same `Company` rows through the same server actions. Every mutation calls `revalidatePath` on all affected routes.

| Action | Must immediately affect |
|---|---|
| Stage change in Sourcing | Map marker colour, stage distribution, Pipeline column, trip candidate scoring |
| Location edit | Map position, mapping-status counts, cluster membership, report geography |
| New call note | Relationship-strength score, last-contacted, trip relationship context |
| Follow-up date change | Follow-up urgency score, "due"/"overdue" report sections, trip prioritisation |
| Lead-owner change | Lead-owner coverage report, ownership overlaps |
| Pipeline card drag | Company stage everywhere, stage-entered timestamp, activity log |

## 6. Canonical enumerations

Single source of truth: `lib/domain/stages.ts`, mirrored by Prisma enums. No section may define its own.

### Opportunity stages

| Stage | Category | In pipeline board | Stage score (0–15) |
|---|---|---|---|
| Not Responded | Active | no | 5 |
| Positive Response | Active | no | 15 |
| Data Received | Active | yes | 14 |
| IOI | Active | yes | 13 |
| LOI | Active | yes | 11 |
| DD | Active | yes | 10 |
| Closed Lost | Closed | no | 0 (hard-excluded from trips) |
| Closed Won | Closed | no | 2 |
| Touch Base Later | Dormant | no | 9 |

Stage score is deliberately highest for **Positive Response** — for a *sourcing* trip the most valuable meeting is an engaged owner not yet in process. Deep-process companies (LOI/DD) still rank well but are managed through the Pipeline, not sourcing travel.

### Touch-base periods
`1 Month` · `3 Months` · `6 Months` · `12 Months`

Moving a company to **Touch Base Later** requires a period, computes `nextFollowUpAt = now + period`, persists both, and makes the company eligible for re-engagement prioritisation once the date approaches.

### Mapping status

| Status | Meaning | Map | Trips |
|---|---|---|---|
| Mapped | Street-level or verified coordinates | plotted, solid | schedulable |
| Approximate Location | City/region centroid only | plotted, hollow ring | schedulable **with a labelled risk** |
| Needs Review | Coordinates present but conflicting/suspect | plotted, warning ring | excluded by default, listed as fixable |
| Unmapped | No usable coordinates | not plotted, listed in review queue | excluded, listed as fixable |

The application must **never** silently present an approximate location as precise. Every surface that consumes coordinates carries the status forward.

### Interaction types
`Email` · `Phone Call` · `Video Call` · `In-Person Meeting` · `Conference` · `Other`

## 7. Sourcing section

**Columns:** Company Name · Website · Industry · Country · State/Province · City · Lead Owner · Year Established · Employee Count · Opportunity Stage · Last Contacted · Next Follow-Up · Notes Indicator · Mapping Status

**Capabilities:** name search · column sort · combined filters · open profile · inline stage change · inline lead-owner assignment · clear filters · **Apply to Map** · **Send to Trip Agent** · CSV export (time permitting)

**Filters (shared model):** Lead Owner · Country · State/Province · City · Industry · Year Established range · Employee Count range · Opportunity Stage · Touch-Base Period · Last Contacted range · Next Follow-Up range · Mapping Status

Filter state is encoded in the URL query string via a single Zod-validated codec (`lib/filters/`), so a filtered Sourcing view can be handed to the Map, the report engine, and the trip agent without re-derivation.

## 8. Company profile

**Company information:** Lead Owner · Website · Company Name · Industry · Description · Country · State/Province · City · Street Address · Postal Code · Latitude · Longitude · Location validation status · Year Established · Employee Count

**Opportunity information:** Opportunity Stage · Date Added · Last Contacted · Next Follow-Up · Touch-Base Period · Date Entered Current Stage · Next Required Action · Last Updated

**Call notes:** Date · Author · Interaction Type · Notes · Outcome · Required Follow-Up · Follow-Up Date

**General notes:** Date · Author · Content

Only a bounded, summarised slice of note content is ever sent to an AI provider (see `TRIP_AGENT_SPEC.md` §7).

## 9. Pipeline section

Four columns: `Data Received` · `IOI` · `LOI` · `DD`. Drag-and-drop stage changes, profile access, lead-owner change, notes, next action, follow-up date, plus Closed Won / Closed Lost terminal actions. Demo-sufficient quality only.

## 10. AI usage boundary

**Deterministic code computes** all facts: distances, counts, stage/industry/follow-up tallies, clusters, scores, travel feasibility, meeting overlaps, day counts.

**AI writes** narrative only: pattern explanation, report summaries, cluster attractiveness rationale, trip rationales, pre-trip action suggestions, itinerary presentation.

AI output can never override a deterministic feasibility check and can never mutate a company record without explicit user confirmation. Every AI-generated string is visually badged as an interpretation, distinct from CRM facts.

## 11. Non-goals for the two-day build

Live traffic · real routing APIs · flight/hotel booking · calendar or email integration · multi-tenant permissions · PDF export · Excel databook extraction.
