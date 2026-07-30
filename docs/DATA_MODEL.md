# Data Model

**Status:** Phase 0 proposal, awaiting approval before any migration is written
**Last updated:** 2026-07-30

## 1. Migration strategy

The repository currently contains one migration (`20260730161508_init`) modelling a **deal-evaluation** product: `Prospect`, `StageDefinition`, `Vertical`, `Scorecard`, `AcquisitionThesis`, `SellerRelationship`, `ProspectForecast`, `ValuationAnalysis`, `SourcingActivity`, `FieldSource`.

That model cannot express the geography-first product: it has no employee count, no year established, no street address or postal code, no touch-base period, no last-contacted or next-follow-up field, no general notes, no trips, no reports, and a mapping-status enum (`PENDING/GEOCODED/MANUAL/FAILED`) that describes *geocoder outcome* rather than *location confidence*.

**Recommendation — single clean reset migration.** Replace `init` with one new baseline migration. Rationale:

- The database holds no production data (the only seeded rows are lookup values and four fictional demo prospects).
- Twelve additive migrations under a 2-day deadline is pure overhead with no rollback value.
- The deal-evaluation models remain fully recoverable from git history (`git show 464d0a0:prisma/schema.prisma`).

**Requires your approval — this is destructive to any deployed database.** See blocking question B2.

The deal-evaluation models (`Scorecard`, `AcquisitionThesis`, `ValuationAnalysis`, `ProspectForecast`, `SellerRelationship`, `FieldSource`) are **dropped from the competition build**. None appear in the required demo path, and carrying them forward costs schema surface and FK churn for zero demo value. Recorded as ADR-004.

## 2. Naming conventions

- Prisma models: `PascalCase` singular. Physical tables: `snake_case` plural via `@@map`.
- Columns: `camelCase` in Prisma, `snake_case` in Postgres via `@map`.
- All timestamps `DateTime` in UTC. Date-only fields (`nextFollowUpAt`, trip dates) stored as `DateTime` at UTC midnight and always formatted with an explicit timezone-free helper to avoid off-by-one-day rendering.

## 3. Enumerations

```prisma
enum OpportunityStage {
  NOT_RESPONDED
  POSITIVE_RESPONSE
  DATA_RECEIVED
  IOI
  LOI
  DD
  CLOSED_LOST
  CLOSED_WON
  TOUCH_BASE_LATER
}

enum TouchBasePeriod {
  ONE_MONTH
  THREE_MONTHS
  SIX_MONTHS
  TWELVE_MONTHS
}

/// Location confidence, NOT geocoder outcome. Drives map rendering,
/// trip eligibility, and every "approximate location" risk warning.
enum MappingStatus {
  MAPPED
  APPROXIMATE
  NEEDS_REVIEW
  UNMAPPED
}

/// How the coordinates were obtained — provenance, separate from confidence.
enum LocationSource {
  MANUAL
  GEOCODED_ADDRESS
  GEOCODED_CITY
  SEED
  UNKNOWN
}

enum InteractionType {
  EMAIL
  PHONE_CALL
  VIDEO_CALL
  IN_PERSON_MEETING
  CONFERENCE
  OTHER
}

enum ActivityType {
  COMPANY_CREATED
  STAGE_CHANGED
  OWNER_CHANGED
  LOCATION_CHANGED
  FOLLOW_UP_CHANGED
  CALL_NOTE_ADDED
  GENERAL_NOTE_ADDED
  TRIP_GENERATED
}

enum TripStatus {
  DRAFT
  PROPOSED
  CONFIRMED
  COMPLETED
  ARCHIVED
}

enum GenerationMethod {
  DETERMINISTIC
  DETERMINISTIC_PLUS_AI
}

enum TravelEstimateType {
  HAVERSINE_HEURISTIC   // straight-line × detour factor ÷ speed band
  MANUAL
}

enum TripStopStatus {
  PROPOSED
  REQUIRED     // user-pinned, engine must include
  EXCLUDED     // user-pinned out, engine must omit
  CONFIRMED
}
```

`OpportunityStage` is a Prisma enum rather than the current `StageDefinition` table. Stages are a fixed product vocabulary, not user-configurable data; making them an enum removes a join from every query in the reporting engine and lets scoring weights live in typed config (`lib/domain/stages.ts`) with `satisfies Record<OpportunityStage, StageConfig>` exhaustiveness checking.

## 4. Core entities

### `TeamMember` → `team_members`

| Column | Type | Notes |
|---|---|---|
| id | String cuid PK | |
| name | String | |
| email | String unique | matched against the auth identity |
| avatarUrl | String? | initials fallback in UI |
| isActive | Boolean default true | inactive members hidden from owner pickers |
| createdAt | DateTime default now | |

Relations: `companiesOwned Company[]`, `callNotes CallNote[]`, `generalNotes GeneralNote[]`, `activities Activity[]`, `reports GeographicReport[]`, `trips SourcingTrip[]`.

### `Company` → `companies`

| Column | Type | Notes |
|---|---|---|
| id | String cuid PK | |
| companyName | String | indexed for search |
| website | String? | |
| industry | String | free-text-backed but seeded from a fixed VMS vertical list; indexed |
| description | String? | |
| country | String | **required** — geography is the product |
| region | String? | state / province |
| city | String? | |
| streetAddress | String? | |
| postalCode | String? | |
| latitude | Float? | |
| longitude | Float? | |
| mappingStatus | MappingStatus default UNMAPPED | |
| locationSource | LocationSource default UNKNOWN | |
| locationValidatedAt | DateTime? | |
| locationNote | String? | e.g. "city centroid only — HQ address unconfirmed" |
| yearEstablished | Int? | |
| employeeCount | Int? | |
| leadOwnerId | String? FK → team_members | nullable: unowned regions are a *reportable finding* |
| opportunityStage | OpportunityStage default NOT_RESPONDED | |
| touchBasePeriod | TouchBasePeriod? | required when stage = TOUCH_BASE_LATER |
| lastContactedAt | DateTime? | denormalised from call notes; see §6 |
| nextFollowUpAt | DateTime? | |
| nextRequiredAction | String? | |
| stageEnteredAt | DateTime default now | |
| createdAt / updatedAt | DateTime | |

Indexes: `@@index([country, region, city])`, `@@index([opportunityStage])`, `@@index([leadOwnerId])`, `@@index([industry])`, `@@index([nextFollowUpAt])`, `@@index([latitude, longitude])`.

Constraints enforced in application code + Zod (Postgres CHECK constraints added by hand in the migration where cheap):
- `mappingStatus != UNMAPPED` ⟹ `latitude` and `longitude` are non-null.
- `opportunityStage = TOUCH_BASE_LATER` ⟹ `touchBasePeriod` is non-null.
- `latitude ∈ [-90, 90]`, `longitude ∈ [-180, 180]`.

**`leadOwnerId` is nullable by design.** Regions without a clear owner is a required output of the Lead-Owner Coverage report; a NOT NULL column would make that finding unrepresentable.

### `CallNote` → `call_notes`

| Column | Type |
|---|---|
| id | String cuid PK |
| companyId | String FK → companies, cascade delete |
| authorId | String FK → team_members |
| interactionType | InteractionType |
| occurredAt | DateTime |
| notes | String |
| outcome | String? |
| requiredFollowUp | Boolean default false |
| followUpAt | DateTime? |
| createdAt / updatedAt | DateTime |

Index: `@@index([companyId, occurredAt])` — this is the hot path for relationship scoring.

### `GeneralNote` → `general_notes`
`id` · `companyId` FK · `authorId` FK · `notes` · `createdAt` · `updatedAt`. Index `@@index([companyId])`.

### `Activity` → `activities`
`id` · `companyId` FK · `actorId` FK? · `activityType` · `previousValue` String? · `newValue` String? · `metadata` Json? · `createdAt`. Index `@@index([companyId, createdAt])`.

Written by server actions on every mutation. Powers the profile timeline and the "no recent activity" report section.

## 5. Reporting and trip entities

### `GeographicReport` → `geographic_reports`
`id` · `createdById` FK? · `name` · `geographicScope` Json · `filters` Json · `reportMetrics` Json · `reportSummary` String? · `createdAt` · `updatedAt`.

`filters` stores the serialised shared filter object so a saved report is exactly reproducible. `reportMetrics` snapshots the deterministic computation; `reportSummary` holds the optional AI narrative. Should-Have — schema ships in Phase 1, UI only if time allows.

### `SourcingTrip` → `sourcing_trips`
`id` · `createdById` FK? · `name` · `origin` String? · `destination` String · `startDate` DateTime? · `endDate` DateTime? · `parameters` Json · `status` TripStatus default DRAFT · `generationMethod` GenerationMethod · `summary` Json? · `createdAt` · `updatedAt`.

`parameters` holds the full `TripRequest` (see `TRIP_AGENT_SPEC.md` §3) so any trip can be regenerated byte-identically. `summary` holds the structured trip summary including AI narrative fields, each tagged with its provenance.

### `SourcingTripDay` → `sourcing_trip_days`
`id` · `sourcingTripId` FK cascade · `dayNumber` Int · `date` DateTime? · `objective` String? · `startingLocation` String? · `endingLocation` String? · `createdAt`. Unique `@@unique([sourcingTripId, dayNumber])`.

### `SourcingTripStop` → `sourcing_trip_stops`

| Column | Type | Notes |
|---|---|---|
| id | String cuid PK | |
| sourcingTripId | String FK cascade | |
| tripDayId | String FK cascade | |
| companyId | String FK | |
| visitOrder | Int | |
| startTime | DateTime? | |
| endTime | DateTime? | |
| estimatedTravelMinutes | Int? | travel **into** this stop |
| travelEstimateType | TravelEstimateType | always surfaced in UI as an estimate |
| priorityScore | Int | 0–100 |
| scoreBreakdown | Json | the six factor sub-scores — never a bare number |
| recommendationReason | String? | |
| preTripAction | String? | |
| status | TripStopStatus default PROPOSED | |
| createdAt | DateTime | |

Unique `@@unique([sourcingTripId, companyId])` — a company cannot be scheduled twice in one trip. Index `@@index([tripDayId, visitOrder])`.

`scoreBreakdown` being a required column enforces the product rule: **no unexplained priority score is ever persisted.**

### `TripExclusion` → `trip_exclusions`
`id` · `sourcingTripId` FK cascade · `companyId` FK · `reasonCode` String · `reasonDetail` String? · `couldIncludeIf` String? · `createdAt`.

Exclusions are first-class persisted rows, not a transient computation, because "which companies were excluded and why" is an explicit demo requirement and must survive a page reload.

## 6. Denormalisation decisions

`Company.lastContactedAt` duplicates `MAX(call_notes.occurred_at)`. Kept denormalised because relationship scoring, the Sourcing table, and three report sections all read it, and recomputing an aggregate per company per render is wasteful at report time. Maintained in the `addCallNote` server action inside a transaction. A `scripts/reconcile-derived.ts` task recomputes it from source if it ever drifts.

`Company.stageEnteredAt` is maintained by the stage-change action; `activities` retains the full history.

## 7. Seed data plan

`prisma/seed.ts` — lookup/essential data only, safe for every environment: team members, industry list. Idempotent upserts.

`prisma/seed-demo.ts` — the demo dataset. Runs only when `ALLOW_DEMO_SEED=1`.

The original guard refused to run under `VERCEL`/`NODE_ENV=production`. Under ADR-018 that is inverted: the Vercel deployment **is** the demo environment, so the demo data must load there. The protection is now a single explicit opt-in variable rather than an environment sniff — unset it and redeploy to get a clean database.

Target shape (exceeds the stated minimums so the reports have signal):

| Dimension | Target |
|---|---|
| Companies | 48 |
| Countries | 6 — USA, Canada, UK, Netherlands, Norway, Ireland |
| Cities | 14+ |
| Industries | 7 VMS verticals |
| Team members | 4 lead owners + 1 unowned pocket |
| Stages | all 9 represented |

Designed clusters (coordinates are real city/suburb centroids; all company names, people, and history are fictional):

| Cluster | Companies | Purpose |
|---|---|---|
| Chicago metro (Chicago, Naperville, Evanston, Schaumburg) | 9 | **Scenario 1** — dense single-metro 2-day trip |
| Toronto ↔ Montreal corridor | 10 (6 / 4) | **Scenario 2** — 3-day two-city regional trip |
| Boston metro (Boston, Cambridge, Waltham) | 7 | secondary strong cluster, tests industry filtering |
| London + Manchester | 8 (5 / 3) | non-US geography, tests intercity transition warning |
| Amsterdam | 4 | small viable cluster |
| Oslo | 3 | small cluster, mixed mapping quality |
| Scattered singletons (Boise, Savannah, Nashville, Galway, Tromsø, …) | 7 | **Scenario 3** — weak geography, must produce an honest weak-trip verdict |

Data-quality spread, deliberately included so the mapping-status system is visibly exercised:
- ~34 `MAPPED` (street-level)
- ~8 `APPROXIMATE` (city centroid, `locationNote` explains why)
- ~3 `NEEDS_REVIEW` (coordinates present but inconsistent with stated city)
- ~3 `UNMAPPED` (no coordinates)

Relationship spread: never-contacted · positive responses · overdue follow-ups (some 60+ days) · due-this-month follow-ups · Touch Base Later at all four periods · stale-but-active (no activity in 9 months) · a Closed Lost inside the Chicago cluster to prove exclusion works.

Notes: ~70 call notes across all six interaction types, ~25 general notes, activity rows generated alongside.

Seeded dates are computed **relative to seed run time** (`subDays(now, n)`), not hardcoded, so "overdue" and "due soon" stay true whenever the demo is run.

## 8. Files this creates or replaces

| Path | Action |
|---|---|
| `prisma/schema.prisma` | replaced |
| `prisma/migrations/20260730161508_init/` | removed (recorded in ADR-004) |
| `prisma/migrations/<new>_geo_sourcing_baseline/` | created |
| `prisma/seed.ts` | rewritten (lookup only) |
| `prisma/seed-sample-data.ts` | replaced by `prisma/seed-demo.ts` |
| `lib/domain/stages.ts` | new — stage config, single source of truth |
| `lib/domain/mapping-status.ts` | new |
| `lib/domain/types.ts` | new — shared `CompanyRecord` view type |
| `lib/generated/prisma/` | regenerated (gitignored) |
