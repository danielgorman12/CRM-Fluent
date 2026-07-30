# Geographic Reporting Engine — Specification

**Status:** Phase 0 proposal, awaiting approval
**Last updated:** 2026-07-30

## 1. Design principle

Every number in every report is produced by a **pure, deterministic, unit-testable TypeScript function**. No AI model is asked to count, measure, cluster, or rank. AI is permitted only to write prose *about* an already-computed metrics object.

The engine is a set of pure functions with the signature:

```ts
(companies: CompanyRecord[], options: ReportOptions) => ReportSection
```

No database access, no I/O, no `Date.now()` inside the functions — the evaluation timestamp is passed in as `options.asOf`. This makes every section trivially testable with a fixture array and makes report output reproducible.

## 2. Why in-memory rather than SQL

The competition dataset is ~48 companies; a realistic production dataset for a single VMS acquirer is low thousands. All analytics run in-memory on a single `findMany` result.

| | In-memory TS | SQL aggregation |
|---|---|---|
| Haversine clustering | trivial | painful without PostGIS |
| Unit testing | fixture array, no DB | needs a test database |
| Shared with trip agent | same functions, same types | duplicated logic |
| Speed at n=48 | sub-millisecond | network round-trip per section |

Decision recorded as ADR-005. The `CompanyRecord[]` load is the only DB call; every section derives from that one array, so a full report is one query regardless of section count.

## 3. Module layout

```
lib/geo/
  haversine.ts        distanceKm, centroid, boundingBox, midpoint
  travel.ts           roadDistanceKm, travelMinutes, travelMode, isSameDayFeasible
  cluster.ts          buildClusters — constrained single-link agglomerative
  cluster-naming.ts   deterministic human cluster names
lib/reports/
  types.ts            ReportOptions, GeographicReport, every section type
  summary.ts          §5.1 Geographic Summary
  concentration.ts    §5.2 Prospect Concentration
  stage-mix.ts        §5.3 Stage Distribution
  industry.ts         §5.4 Industry Distribution
  relationships.ts    §5.5 Relationship & Follow-Up Analysis
  ownership.ts        §5.6 Lead-Owner Coverage
  opportunities.ts    §5.7 Opportunity Clusters
  whitespace.ts       §5.8 Geographic Whitespace
  build-report.ts     composes all sections
lib/filters/
  schema.ts           Zod filter schema — the shared model
  url.ts              filters ⇄ URLSearchParams codec
  apply.ts            applyFilters(companies, filters) — used by ALL sections and the trip agent
```

`lib/filters/apply.ts` is the single filtering implementation. Sourcing, Map, reports, and the trip agent all call it. There is no second filtering path anywhere in the codebase.

## 4. Geodesic primitives

### Distance
Haversine on a mean Earth radius of 6371.0088 km.

```ts
distanceKm(a: Coords, b: Coords): number
```

### Road-distance and travel-time estimation

Straight-line distance is not a travel time. The heuristic, all constants in `lib/geo/travel-config.ts`:

```
roadKm      = straightLineKm × DETOUR_FACTOR          // 1.30
speedKmh    = roadKm < 25   ? 32     // dense urban
            : roadKm < 120  ? 72     // suburban / regional
            :                 88     // highway
travelMin   = ceil(roadKm / speedKmh × 60) + FIXED_OVERHEAD_MIN   // 8 (parking, lobby, wayfinding)
```

Beyond `FLIGHT_THRESHOLD_KM` (450) the pair is flagged `REQUIRES_INTERCITY_TRANSIT` and may not be scheduled within one day without an explicit warning.

**Every travel figure rendered in the UI carries a visible "estimated" label and the estimate type.** These are never presented as live traffic or routed distances.

## 5. Report sections

All sections operate on the filtered set. Each returns both the metric and the company IDs behind it, so every figure in the UI is clickable through to the underlying companies.

### 5.1 Geographic Summary
Total prospects · mapped · approximate · needs-review · unmapped · distinct cities · distinct regions · distinct countries · distinct industries · distinct lead owners · unowned count.

### 5.2 Prospect Concentration
- Companies by country, by region, by city — ranked, with count, share, and stage mix.
- Largest geographic clusters (from §6).
- **Density**: for each cluster, prospects per 1000 km² of its bounding box, plus prospects within a practical travel radius (default 60 km) of the cluster centroid.
- "Areas with several prospects within a practical travel radius" = clusters where ≥3 companies sit within `PRACTICAL_RADIUS_KM` of the centroid.

### 5.3 Stage Distribution
Counts and shares for all nine stages within the selected geography, plus an *active / dormant / closed* rollup. Rendered as a stacked bar and a table. Zero-count stages are shown explicitly — an absent stage is a finding, not a blank.

### 5.4 Industry Distribution
- Ranked industries in the selected geography.
- **Concentration**: Herfindahl-Hirschman Index over industry shares, bucketed `Highly concentrated` (HHI ≥ 2500) / `Moderately concentrated` (1500–2500) / `Diverse` (< 1500).
- Cities with ≥2 companies in the same vertical → "vertical depth" list.
- Cities with ≥3 distinct verticals → "diverse VMS opportunity" list.

### 5.5 Relationship and Follow-Up Analysis
Evaluated against `options.asOf`:

| Bucket | Rule |
|---|---|
| Never contacted | no call notes and `lastContactedAt` null |
| Positive responses | stage = POSITIVE_RESPONSE |
| Due for follow-up | `nextFollowUpAt` within the next 30 days |
| Overdue | `nextFollowUpAt` < asOf |
| Touch Base Later | stage = TOUCH_BASE_LATER, grouped by period, with days-until-due |
| No recent activity | `lastContactedAt` older than 180 days and stage is active |
| Requires pre-trip outreach | never contacted, **or** last contact > 120 days, **or** overdue |

### 5.6 Lead-Owner Coverage
- Companies per lead owner.
- Per owner: geographic footprint (countries, cities, centroid, mean spread in km).
- **Regions without a clear owner**: regions where >40% of companies have a null `leadOwnerId`, or where no single owner holds ≥50%.
- **Overlap**: cities where ≥2 owners each hold ≥1 company → coordinated-travel candidates, quantified as "N companies across M owners within X km".

### 5.7 Opportunity Clusters
Per cluster (from §6): name · centroid · prospect count · key cities · main industries · stage mix · count due for follow-up · **estimated viable meetings** · **recommended trip length** · **suggested priority**.

Deterministic definitions:

```
viableMeetings   = companies where stage ∉ {CLOSED_LOST, CLOSED_WON}
                              and mappingStatus ∈ {MAPPED, APPROXIMATE}
recommendedDays  = clamp(ceil(viableMeetings / DEFAULT_MEETINGS_PER_DAY), 1, 5)   // default 4/day
clusterPriority  = round( 0.35 × normalised(viableMeetings)
                        + 0.30 × normalised(mean stage score)
                        + 0.20 × normalised(follow-up urgency density)
                        + 0.15 × normalised(compactness) )                        // 0–100
```
`compactness = 1 - clamp(meanDistanceToCentroid / LINK_RADIUS_KM, 0, 1)`.

Every cluster card shows the four sub-components, never a bare priority number.

### 5.8 Geographic Whitespace
Whitespace claims are the easiest place to accidentally fabricate. Every finding here is derived strictly from CRM data and is rendered under an **"Interpretation"** badge, distinct from factual metrics.

| Finding | Deterministic rule |
|---|---|
| Thin coverage | region present in the dataset with 1–2 companies while a peer region in the same country has ≥5 |
| Adjacent opportunity | a city with 1–2 companies within 150 km of a cluster of ≥5 — suggests the cluster's catchment is under-sourced |
| Identified but not worked | region where ≥60% of companies are `NOT_RESPONDED` and ≥5 companies exist |
| Worked but not progressing | region where ≥70% have been contacted but 0 have reached `DATA_RECEIVED` or beyond |
| Unowned geography | region with ≥3 companies and no lead owner holding a majority |

The engine will **not** assert that a region has market potential the CRM has no record of. A region absent from the dataset produces no finding — only a note that the dataset contains no coverage there.

## 6. Clustering algorithm

**Constrained single-link agglomerative clustering.** Chosen over k-means (requires *k*, non-deterministic seeding, produces geographically meaningless centroids) and DBSCAN (parameter-sensitive, and its chaining behaviour is exactly what breaks trip feasibility).

```
Config — lib/geo/cluster-config.ts
  LINK_RADIUS_KM            60    two companies link if within this distance
  MAX_CLUSTER_DIAMETER_KM   150   a merge is REJECTED if it exceeds this
  MIN_CLUSTER_SIZE          2
  PRACTICAL_RADIUS_KM       60
```

Algorithm:

1. Drop companies without usable coordinates (`UNMAPPED`, or `NEEDS_REVIEW` when `options.strictLocations`).
2. Sort input by `(latitude, longitude, id)` — guarantees a **stable, deterministic** result for identical input regardless of DB row order.
3. Seed each company as its own cluster.
4. Repeatedly find the closest pair of clusters by single-link distance. Merge **only if** link distance ≤ `LINK_RADIUS_KM` **and** the resulting cluster's max pairwise diameter ≤ `MAX_CLUSTER_DIAMETER_KM`. Otherwise mark that pair ineligible and continue.
5. Stop when no eligible merge remains.
6. Clusters below `MIN_CLUSTER_SIZE` are returned separately as `singletons` — they are still reported (they matter for whitespace and weak-geography honesty), just not as clusters.

The diameter cap is the important part: it is what prevents single-link chaining from producing a "cluster" that stretches Boston → Philadelphia and then telling the user it supports a 2-day trip.

Complexity O(n³) worst case, irrelevant at n ≤ a few hundred. If the dataset grows past ~2000 the algorithm is swapped for a grid-accelerated variant behind the same interface.

### Cluster naming
Deterministic, no AI: the city containing the most companies, suffixed by `" metro"` when the cluster spans >1 city, or `"A / B corridor"` when two cities each hold ≥30% of the cluster. Ties broken alphabetically so names are stable across runs.

## 7. Report inputs

`ReportOptions`:

| Field | Notes |
|---|---|
| scope | `{ level: 'world'\|'country'\|'region'\|'city'\|'cluster', value?: string }` |
| filters | the shared filter object (§3) |
| includeClosed | `active` \| `closed` \| `both` (default `active`) |
| asOf | evaluation timestamp — injected, never `Date.now()` inside a section |
| strictLocations | exclude `NEEDS_REVIEW` from geometry (default true) |

## 8. Presentation

Server components compute the report; client components render. Layout order matches decision-making order, not data-model order:

1. **Summary cards** — headline counts + a data-quality strip (mapped / approximate / needs review / unmapped, each clickable).
2. **Map**, filtered to scope, with cluster hulls overlaid.
3. **Opportunity cluster cards** — the highest-value output, placed above the raw distributions.
4. **Concentration tables** — country / region / city, sortable.
5. **Stage + industry distributions** — Recharts bar and stacked bar.
6. **Relationship & follow-up panel** — the actionable bucket list.
7. **Lead-owner coverage**.
8. **Whitespace** — badged as Interpretation.
9. **Recommended actions** — deterministic action list, with an optional AI narrative summary above it.

Every metric is a link. Clicking drills through to: the filtered Sourcing list · the map scoped to that geography · the cluster detail · or the trip agent pre-loaded with that cluster as its candidate set.

## 9. AI narrative layer

Optional, additive, never load-bearing. Input is the **computed metrics object only** — never raw company rows, never note bodies. Output is validated by Zod and rendered under an "AI interpretation" badge.

If `AI_PROVIDER` is unset, the key is missing, the call fails, or the response fails validation, the report renders completely with a deterministic template summary. The report is never blocked on the model.

## 10. Test plan

Fixture-driven unit tests in `lib/geo/__tests__` and `lib/reports/__tests__` (Vitest):

- `haversine` against known city-pair distances (±1%).
- Clustering: Chicago fixture yields exactly 1 cluster; Boston+Philadelphia fixture yields 2 (diameter cap holds); shuffled input yields an identical result (determinism).
- Every report section against a hand-checked 12-company fixture with known expected counts.
- Follow-up bucketing at boundary dates (exactly today, exactly 30 days out) using a fixed `asOf`.
- Whitespace rules produce zero findings on an empty/uniform dataset (no fabrication).
