# Sourcing-Trip Agent — Specification

**Status:** Phase 0 proposal, awaiting approval
**Last updated:** 2026-07-30

## 1. What the agent must answer

1. Which geography should the user visit?
2. Which companies should be included?
3. Why is each company included?
4. Which companies need contact **before** the trip?
5. How many days does the trip require?
6. In what order should meetings occur?
7. Is the schedule geographically and operationally realistic?
8. Which companies were excluded and why?
9. What are the trip's objectives?
10. What should the professional do before and after?

Questions 1–8 are answered by **deterministic code**. Questions 9–10 and the prose around 3 are the only places AI writes anything.

## 2. Seven-layer architecture

```
lib/trip/
  types.ts             TripRequest, TripPlan, ScoreBreakdown, Exclusion, Warning
  scoring-config.ts    ALL weights and thresholds — the only place they live
  candidates.ts        L1 candidate selection
  scoring.ts           L2 deterministic scoring
  grouping.ts          L3 day-group assignment (uses lib/geo/cluster)
  route.ts             L4a nearest-neighbour + 2-opt sequencing
  schedule.ts          L4b clock-time schedule construction
  validate.ts          L5 feasibility validation
  narrative.ts         L6 AI explanation (optional)
  plan.ts              orchestrator: request → TripPlan
lib/ai/
  provider.ts          AI_PROVIDER abstraction
  schemas.ts           Zod schemas for every AI response
  prompts/trip.ts      prompt construction with strict payload bounding
```

**Layers 1–5 have zero AI involvement and zero network I/O.** `plan.ts` produces a complete, valid, renderable `TripPlan` before the AI layer is ever consulted. This is the guarantee that makes the fallback trivially correct: the fallback *is* the primary output.

### Layer 1 — Candidate selection
Apply the shared filter model (`lib/filters/apply.ts`) plus trip-specific constraints. Every rejected company is recorded as a structured `Exclusion` with a machine reason code, not silently dropped.

Hard exclusions (never schedulable):

| Reason code | Rule | `couldIncludeIf` |
|---|---|---|
| `CLOSED_LOST` | stage = CLOSED_LOST | "Not recommended — relationship previously closed out." |
| `NO_COORDINATES` | mappingStatus = UNMAPPED | "Add coordinates or a street address on the company profile." |
| `LOCATION_UNRELIABLE` | mappingStatus = NEEDS_REVIEW | "Resolve the conflicting location data." |
| `OUTSIDE_RADIUS` | distance from anchor > maxTravelRadiusKm | "Increase the travel radius to N km." |
| `USER_EXCLUDED` | pinned out by the user | "Remove the exclusion." |

Soft exclusions (eligible but not selected): `LOWER_PRIORITY`, `DAY_CAPACITY_REACHED`, `GEOGRAPHICALLY_ISOLATED`, `STAGE_FILTERED`, `INDUSTRY_FILTERED`, `SIZE_FILTERED`, `OWNER_FILTERED`. Each carries the specific parameter change that would admit it.

### Layer 2 — Deterministic scoring

100 points across six explainable factors. All weights in `lib/trip/scoring-config.ts`; changing them requires an ADR entry (see change-control rule 8).

| Factor | Max | Computation |
|---|---|---|
| Geographic fit | 20 | `20 × (1 − clamp((d − 10) / (maxRadiusKm − 10), 0, 1))` where `d` = km from the trip anchor. ≤10 km scores full. |
| Relationship strength | 20 | base from interaction history × recency multiplier (below) |
| Follow-up urgency | 20 | from `nextFollowUpAt` vs trip start (below) |
| Opportunity stage | 15 | `STAGE_CONFIG[stage].stageScore` (see PRODUCT_SPEC §6) |
| Industry fit | 15 | requested industries given → in-list 15, else 4. Not given → 9 baseline + up to 6 for the industry's concentration within the day-group. |
| Trip efficiency | 10 | `10 × clamp(neighboursWithin25km / 4, 0, 1)` — rewards companies that anchor a dense sub-cluster |

**Relationship strength base** (max of applicable, additive up to cap 20):
in-person meeting ever +8 · video/phone call ever +6 · any positive-response note +4 · email sent but no response +1 · never contacted 0.
**Recency multiplier** on the base: last contact ≤90d ×1.0 · ≤180d ×0.85 · ≤365d ×0.70 · older or never ×0.50.

**Follow-up urgency:**

| Condition (vs trip start) | Points |
|---|---|
| Overdue by >30 days | 20 |
| Overdue by 0–30 days | 18 |
| Due inside the trip window | 16 |
| Due within 30 days after | 12 |
| Due within 90 days | 8 |
| No follow-up date, stage active | 4 |
| Due >180 days out | 2 |

Every score is persisted with its `scoreBreakdown` JSON and rendered as:

```
Northwind Practice Systems — priority 86/100
  Geographic fit        20/20   4 km from Chicago Loop anchor
  Relationship strength 18/20   in-person meeting 2 months ago
  Follow-up urgency     17/20   follow-up was due 12 days ago
  Opportunity stage     14/15   Data Received
  Industry fit          10/15   Healthcare IT — not in requested priorities
  Trip efficiency        7/10   3 other candidates within 25 km
```

A bare number is never shown anywhere in the UI.

### Layer 3 — Geographic grouping
Reuses `lib/geo/cluster.ts` with trip-tuned config, then assigns clusters to days:

1. Cluster the selected candidates.
2. Rank clusters by total score.
3. Assign clusters to days largest-first; a cluster exceeding `maxMeetingsPerDay` spans consecutive days.
4. A day may hold two clusters only if their centroids are within `SAME_DAY_MAX_KM` (default 80 km).
5. Cross-day transitions >`FLIGHT_THRESHOLD_KM` (450) become an explicit **transit day-start** with a warning, never an intra-day hop.

### Layer 4 — Route sequencing and schedule construction

**Sequencing** per day: nearest-neighbour from the day's start point, then **2-opt** improvement until no swap reduces total travel (bounded at 100 iterations). Deterministic given a fixed start.

**Schedule** walks the clock:

```
Config — lib/trip/scoring-config.ts
  dayStart              09:00      (overridable per request)
  dayEnd                17:30
  meetingMinutes        75
  bufferMinutes         20         minimum gap between meetings
  maxMeetingsPerDay     4
  lunchWindow           12:30–13:15  (blocked)
  maxDailyTravelMinutes 180
```

For each stop: `arrival = previousEnd + travelMinutes(prev, next) + buffer`. If `arrival + meetingMinutes > dayEnd`, the stop overflows to the next day or is excluded with `DAY_CAPACITY_REACHED`. Travel minutes come from `lib/geo/travel.ts` and are tagged `HAVERSINE_HEURISTIC`.

### Layer 5 — Validation

Runs on the constructed plan and **cannot be overridden by AI**. Produces structured `Warning[]` with severity `error` | `warning` | `info`.

| Check | Severity |
|---|---|
| Meeting time overlap | error |
| Stop outside day hours | error |
| Meetings/day > max | error |
| Duplicate company in trip | error |
| Required company missing | error |
| Excluded company present | error |
| Stop with no coordinates | error |
| Travel gap < buffer | warning |
| Daily travel > maxDailyTravelMinutes | warning |
| Intercity hop within one day | warning |
| Stop uses an `APPROXIMATE` location | warning |
| Fewer viable meetings than requested | warning |
| Day with a single meeting | info |

An `error`-severity plan is still returned and rendered — visibly flagged — rather than silently discarded. Hiding an infeasible plan would hide the reason.

### Layer 6 — AI explanation
Runs only after a validated plan exists. See §7.

### Layer 7 — User review
The plan is displayed as a proposal. Nothing is persisted to `sourcing_trips` and no company record is touched until the user explicitly saves or applies.

## 3. Trip request

```ts
type TripRequest = {
  // geography
  originCity?: string
  destination: { level: 'city'|'region'|'country'|'cluster'|'selection', value: string }
  maxTravelRadiusKm: number          // default 75
  // dates
  startDate?: string
  endDate?: string
  maxDays: number                    // default 3
  // day shape
  dayStart: string                   // "09:00"
  dayEnd: string                     // "17:30"
  meetingMinutes: number             // 75
  bufferMinutes: number              // 20
  maxMeetingsPerDay: number          // 4
  // candidate constraints (shared filter model)
  filters: CompanyFilters
  priorityIndustries?: string[]
  targetCompanyCount?: number
  // behaviour switches
  prioritiseExistingRelationships: boolean   // +25% relationship weight
  includeUncontacted: boolean
  includeTouchBaseLater: boolean
  // pins
  requiredCompanyIds: string[]
  excludedCompanyIds: string[]
}
```

## 4. Entry points

| Entry | Behaviour |
|---|---|
| Selected geography | destination pre-set from the map scope |
| Current map filters | `filters` pre-populated from the shared URL filter state |
| Selected cluster | candidate set pinned to cluster members, anchor = centroid |
| Selected companies | `requiredCompanyIds` pre-populated from table selection |
| Report recommendation | "Plan a trip" button on any opportunity-cluster card |
| Free-text instruction | see §5 |

## 5. Free-text prompt handling

Free text is used **only to fill the structured `TripRequest`** — never to plan the trip.

```
"Build a two-day sourcing trip around Chicago focused on healthcare and education software companies."
    ↓ parse (AI when available, regex/keyword fallback otherwise)
{ destination: {level:'city', value:'Chicago'}, maxDays: 2,
  priorityIndustries: ['Healthcare IT','Education'] }
    ↓
Parsed parameters are shown to the user in the form, editable, before generation.
    ↓
Deterministic engine (Layers 1–5) plans the trip.
```

Parsing output is Zod-validated against `TripRequestPatchSchema`; unrecognised geographies or industries are reported as "couldn't interpret X" rather than guessed. Because parsed parameters are surfaced in the editable form before generation, a mis-parse is visible and correctable rather than silently wrong.

The keyword fallback handles the four documented example prompts without any API key: city/country name matching against distinct dataset values, `N-day`/`two-day`/`three-day` patterns, stage names, industry names, and employee-count ranges (`20 to 150 employees`).

## 6. Output shape

```ts
type TripPlan = {
  summary: {
    name, geography, startDate, endDate, dayCount, companyCount,
    primaryObjective,        // AI or deterministic template
    mainIndustries: string[],
    rationale,               // AI or deterministic template
    provenance: 'ai' | 'deterministic'
  }
  companies: Array<{
    companyId, companyName, location, opportunityStage, leadOwner,
    priorityScore, scoreBreakdown: ScoreBreakdown,   // always present
    inclusionReason,                                 // deterministic sentence, optionally AI-rewritten
    relationshipContext,                             // from CRM facts only
    preTripAction
  }>
  days: Array<{
    dayNumber, date, objective, startingLocation, endingLocation,
    totalTravelMinutes, warnings: Warning[],
    stops: Array<{
      companyId, companyName, visitOrder, startTime, endTime, address,
      estimatedTravelMinutes, travelEstimateType, bufferMinutes,
      sequenceReason, mappingStatus
    }>
  }>
  preTripActions: Array<{ companyId, action, reason, dueBy }>
  exclusions: Array<{ companyId, companyName, reasonCode, reasonDetail, couldIncludeIf }>
  warnings: Warning[]
  meta: { generationMethod, generatedAt, requestHash }
}
```

`requestHash` is a stable hash of the `TripRequest`, which makes regeneration idempotent and lets the UI detect "parameters changed since this plan was generated".

## 7. AI layer — safety contract

| Rule | Implementation |
|---|---|
| Server-side only | all calls in server actions / route handlers; no key reaches the client |
| Bounded payload | max 25 companies × a whitelisted field set; note content reduced to a ≤160-char extractive summary of the **2 most recent** call notes |
| No full-database exposure | only the already-filtered candidate set is serialised |
| Schema-validated | every response parsed with Zod; failure → deterministic fallback |
| No invention | the prompt supplies a closed company list; any returned `companyId` not in that list causes the whole response to be discarded |
| No authority over feasibility | AI output is merged into narrative fields only; `days`, `stops`, times, scores, and exclusions are never overwritten |
| No silent writes | AI never mutates a company record; suggested changes surface as a confirmation prompt |
| Visible provenance | every AI-authored string renders under an "AI interpretation" badge |

Provider abstraction (`lib/ai/provider.ts`):

```
AI_PROVIDER=anthropic|openai|none
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

Missing key or `none` → the whole AI layer short-circuits and the deterministic narrative is used. **The app is fully functional and demo-complete with no API key at all**; AI is strictly additive polish.

## 8. Refinement

Every refinement re-runs Layers 1–5 with a mutated `TripRequest`. Manual edits are preserved as pins so regeneration does not discard user intent.

| User action | Mechanism |
|---|---|
| Remove company | add to `excludedCompanyIds`, regenerate |
| Add / require company | add to `requiredCompanyIds`, regenerate |
| Change trip length | `maxDays`, regenerate |
| Change meeting duration / daily hours / radius | corresponding field, regenerate |
| Reorder meetings | manual `visitOrder` override, schedule re-walked, validation re-run |
| "Replace A with another healthcare prospect" | exclude A, set `priorityIndustries`, regenerate |
| "Prioritise positive responses over uncontacted" | `prioritiseExistingRelationships = true`, `includeUncontacted = false` |
| "Limit driving to 60 minutes between meetings" | `maxLegTravelMinutes = 60` constraint in schedule construction |

Required companies that cannot be feasibly scheduled are **still included** and flagged with an error-severity warning explaining the conflict — the engine never silently drops a user-pinned company.

## 9. Test plan (Vitest, `lib/trip/__tests__`)

**Scenario 1 — City cluster (Chicago, 9 companies, 2 days).**
Asserts: Closed Lost excluded · all stops within radius · ≤4 meetings/day · no time overlaps · every gap ≥ buffer · every stop has a 6-factor breakdown summing to its total · pre-trip actions generated for never-contacted companies.

**Scenario 2 — Multi-city region (Toronto + Montreal, 3 days).**
Asserts: companies grouped by city, not interleaved · no same-day Toronto↔Montreal scheduling · the transition appears as a day boundary with a transit warning · 2-opt output has total travel ≤ nearest-neighbour output.

**Scenario 3 — Weak geography (Tromsø / scattered singletons).**
Asserts: plan is returned, **not** fabricated · `warnings` contains `FEWER_VIABLE_MEETINGS` · exclusions explain which criteria shrank the set · `couldIncludeIf` suggests radius expansion · a stronger alternative region is named from actual data · day count is reduced rather than padded.

**Unit-level:** scoring boundary cases (exactly 10 km, exactly 30 days overdue, never contacted) · determinism (shuffled input → identical plan) · validator catches each error condition on a hand-built infeasible plan · AI-response rejection when an unknown `companyId` is returned · full plan generation with `AI_PROVIDER=none`.
