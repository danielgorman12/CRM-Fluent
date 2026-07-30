# Decision Log

Append-only. Each entry records what was decided, why, and what it would cost to reverse.
Scoring weights and trip-feasibility rules may not change without an entry here.

---

## ADR-001 — Keep the existing stack

**Date:** 2026-07-30 · **Status:** Proposed

Next.js 16 App Router, TypeScript, Tailwind v4, shadcn-on-base-ui, Prisma 7 + Postgres, Leaflet + OSM, Recharts, Zod all match the recommended stack and are already wired. Rebuilding would burn hours of a two-day budget for no product gain.

**Reversibility:** n/a — this is the no-change option.

---

## ADR-002 — Replace the domain model rather than extend it

**Date:** 2026-07-30 · **Status:** Proposed

The existing `Prospect` model is built for deal evaluation. It lacks employee count, year established, street address, postal code, touch-base period, last-contacted, next-follow-up, next-required-action, general notes, trips, and reports — roughly 12 additive migrations' worth. Its `GeocodeStatus` enum encodes *geocoder outcome*, not *location confidence*, so it cannot express the required `Mapped / Approximate / Needs Review / Unmapped` distinction that the whole product depends on.

**Reversibility:** the previous schema is recoverable via `git show 464d0a0:prisma/schema.prisma`.

---

## ADR-003 — Opportunity stages as a Prisma enum + typed config, not a database table

**Date:** 2026-07-30 · **Status:** Proposed

The current `StageDefinition` table makes stages user-configurable data. The spec defines a fixed nine-stage vocabulary. Moving to an enum removes a join from every reporting query, allows `satisfies Record<OpportunityStage, StageConfig>` exhaustiveness checks so a new stage cannot be added without updating colour, order, and score, and lets scoring weights live in reviewable source.

**Cost of reversal:** moderate — reintroducing the table means restoring joins across the reporting engine.

---

## ADR-004 — Drop the deal-evaluation models from the competition build

**Date:** 2026-07-30 · **Status:** **Accepted** (user-approved — confirmed the demo will not be asked about deal quality)

`Scorecard`, `AcquisitionThesis`, `SellerRelationship`, `ProspectForecast`, `ValuationAnalysis`, and `FieldSource` (and their seven server-action files, seven validation schemas, and seven profile sub-pages) appear nowhere in the required demo path. Retaining them costs FK churn against the renamed `Company` model and schema surface, for zero demo value.

This discards existing working code. It is recorded here rather than done quietly.

**Reversibility:** full — everything is in git at `464d0a0`.

---

## ADR-017 — Stage scores rank Positive Response above LOI and DD

**Date:** 2026-07-30 · **Status:** **Accepted** (user-approved)

`POSITIVE_RESPONSE` scores 15/15, above `DATA_RECEIVED` 14, `IOI` 13, `LOI` 11, `DD` 10.

For a **sourcing** trip the highest-value meeting is an engaged owner not yet in process. Companies at LOI or DD are managed through the Pipeline and structured deal process, not through sourcing travel — visiting them is worthwhile but is not what a sourcing trip is for.

This ordering materially shapes every generated itinerary and all three demo scenarios. It lives in `lib/domain/stages.ts` as `stageScore`.

**Change control:** per rule 8, this ordering may not be altered silently. Any change requires a new ADR and re-running the three scenario tests, whose assertions depend on it.

---

## ADR-005 — Compute all analytics in memory, not in SQL

**Date:** 2026-07-30 · **Status:** Proposed

At ~48 companies (low thousands in production) a single `findMany` feeding pure TypeScript functions is faster than per-section SQL aggregation, needs no PostGIS for haversine work, is unit-testable against fixture arrays with no test database, and lets the report engine and the trip agent share one implementation.

**Reversal trigger:** dataset beyond ~5,000 companies, or a report page exceeding ~300 ms of compute.

---

## ADR-006 — Constrained single-link agglomerative clustering

**Date:** 2026-07-30 · **Status:** Proposed

Rejected k-means (needs *k* up front, non-deterministic seeding, produces geographically arbitrary centroids) and DBSCAN (parameter-sensitive; its chaining behaviour is precisely what breaks trip feasibility).

Single-link with a **link radius of 60 km plus a hard 150 km max-diameter merge rejection** gives geographic clusters with a bounded guarantee: no "cluster" can stretch across a region and then be reported as supporting a two-day trip. Input is pre-sorted by `(lat, lng, id)` so results are stable regardless of database row order.

**Reversal:** algorithm sits behind `buildClusters()`; a grid-accelerated variant can replace it without touching callers.

---

## ADR-007 — `supercluster` for map clustering, not a react-leaflet wrapper

**Date:** 2026-07-30 · **Status:** Proposed

`react-leaflet-markercluster` compatibility with react-leaflet 5 / React 19 is unverified, and a broken map ends the demo. `supercluster` is a pure data structure: points in, clusters out, rendered with the `CircleMarker` components already in use. No wrapper compatibility risk, and the same index serves report drill-through.

---

## ADR-008 — Deterministic engine produces a complete plan before AI is consulted

**Date:** 2026-07-30 · **Status:** Proposed

Layers 1–5 of the trip engine have no AI and no network I/O, and emit a fully valid, renderable `TripPlan`. The AI layer only merges narrative into designated fields.

This makes the "deterministic fallback" correct by construction rather than by a second code path that could rot: the fallback *is* the primary output. It also guarantees the application demos completely with no API key.

---

## ADR-009 — No unexplained priority scores, enforced at the schema level

**Date:** 2026-07-30 · **Status:** Proposed

`sourcing_trip_stops.scoreBreakdown` is a **required** JSON column. A stop cannot be persisted without its six factor sub-scores. The product rule "do not produce an unexplained priority score" is therefore enforced by the database rather than by UI convention.

---

## ADR-010 — `Company.leadOwnerId` is nullable

**Date:** 2026-07-30 · **Status:** Proposed

"Regions without a clear owner" is a required Lead-Owner Coverage output. A `NOT NULL` column with a placeholder owner would make that finding unrepresentable and would silently corrupt ownership-concentration metrics.

---

## ADR-011 — Travel times are labelled estimates, everywhere

**Date:** 2026-07-30 · **Status:** Proposed

Travel time is `haversine × 1.30 detour ÷ banded speed + 8 min overhead`, tagged `HAVERSINE_HEURISTIC`, and every rendered figure carries a visible "estimated" label. No routing API, no traffic data, and no presentation that implies either.

**Reversal:** `lib/geo/travel.ts` is the single implementation; a routing provider can be swapped in behind it, changing the `travelEstimateType` tag.

---

## ADR-012 — Free text sets parameters; it never plans the trip

**Date:** 2026-07-30 · **Status:** Proposed

Natural-language prompts are parsed into a `TripRequest` patch, shown to the user in the editable form, and then handed to the deterministic engine. A mis-parse is visible and correctable rather than silently producing a wrong itinerary. A keyword/regex fallback handles the documented example prompts with no API key.

Given ADR-016, the keyword/regex parser is the **only** parser in the competition build.

---

## ADR-013 — ~~Node.js LTS installed via winget~~

**Date:** 2026-07-30 · **Status:** ~~Accepted~~ → **SUPERSEDED by ADR-018**

Original decision: install Node LTS locally via winget. Reversed once it was established that no local Node runtime is available and the application builds and runs on Vercel.

---

## ADR-014 — ~~Local Prisma dev database~~

**Date:** 2026-07-30 · **Status:** ~~Accepted~~ → **SUPERSEDED by ADR-018**

Original decision: target `npx prisma dev`. Not viable — the Prisma CLI requires local Node. Replaced by the existing hosted Postgres attached to the Vercel project.

The clean-baseline half of this decision survives: `20260730161508_init` is still removed and replaced with a single geography-first baseline migration. It now runs against the hosted database via `prisma migrate deploy` during the Vercel build.

---

## ADR-015 — Demo-mode authentication alongside Entra SSO

**Date:** 2026-07-30 · **Status:** **Accepted, amended 2026-07-30**

`AUTH_DEMO_MODE=1` enables an Auth.js Credentials provider that signs in as any seeded `TeamMember` with one click. The Microsoft Entra provider stays wired and is the only provider when the flag is absent.

Rationale: a live competition demo must not depend on an Azure tenant, a client secret, or a network round-trip to Microsoft. Retaining Entra means the deployment story stays intact.

**Amendment (supersedes the original guard).** The original guard registered the credentials provider only when `NODE_ENV !== "production"`. That is now wrong: under ADR-018 the demo *is* the production Vercel deployment, so the guard would disable exactly the sign-in the demo depends on.

Revised guard: the credentials provider is registered **only** when `AUTH_DEMO_MODE === "1"`, with no `NODE_ENV` condition.

**Accepted consequence:** setting that variable in Vercel makes the deployment signable-into by anyone who reaches it. This is acceptable for a competition build holding entirely fictional data, and is reversible by unsetting the variable and redeploying. The trade-off is recorded here rather than left implicit. The login page renders a visible "Demo mode" banner whenever the provider is active, so the state is never ambiguous.

---

## ADR-018 — Vercel is the build, run, and verification environment

**Date:** 2026-07-30 · **Status:** **Accepted** (user-approved)

No Node.js runtime exists on the development machine and none will be installed. There is no local `npm`, `npx`, dev server, typechecker, test runner, or Prisma CLI.

Consequences, all of which shape the rest of the build:

1. **The verification loop is a git push.** Every check runs in the Vercel build; feedback is ~2–4 minutes per iteration instead of ~2 seconds.
2. **Work is batched into large, carefully-reviewed commits.** A commit-per-small-change rhythm would spend hours on round-trips for typos. Code is read closely before pushing because it cannot be compiled first.
3. **The database is the hosted Postgres already attached to the Vercel project** (`DATABASE_URL` set), replacing ADR-014's local instance. The user has approved dropping its current contents.
4. **UI is verified in a browser against preview deployments** — map rendering, filter behaviour, console errors. This recovers most of what losing a local dev server costs.
5. **The demo seed must run on Vercel**, because Vercel is where the demo lives. `seed-demo.ts`'s blanket production refusal becomes an explicit `ALLOW_DEMO_SEED=1` opt-in.

**Principal risk:** an 18-hour budget against a 2–4 minute verification cycle. Mitigated by ADR-019 through ADR-021. If the loop proves worse than estimated, the MVP cutoff in `BUILD_PLAN.md` is applied earlier and more aggressively than planned.

---

## ADR-019 — Hand-written migration SQL with a build-time drift check

**Date:** 2026-07-30 · **Status:** **Accepted**

`prisma migrate dev` cannot be run — it needs local Node and a shadow database. The baseline migration SQL is therefore written by hand into `prisma/migrations/<timestamp>_geo_sourcing_baseline/migration.sql` and applied by `prisma migrate deploy` during the Vercel build.

**The danger this creates:** `prisma migrate deploy` executes the SQL without checking it against `schema.prisma`, while `prisma generate` derives the TypeScript client *from* `schema.prisma`. If the two drift, the build succeeds and the application fails at runtime — during the demo, with a confusing error.

**Mitigation, non-optional:** the build runs

```
prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel   prisma/schema.prisma \
  --exit-code
```

after `migrate deploy`. A non-empty diff between the live database and the schema fails the build. Drift is caught at deploy time, never at demo time.

---

## ADR-020 — Verification runs inside the Vercel build

**Date:** 2026-07-30 · **Status:** **Accepted** (user-approved)

```
build = prisma generate
     && vitest run
     && prisma migrate deploy
     && prisma migrate diff --exit-code      # schema/SQL drift guard
     && prisma db seed
     && next build
```

One push verifies unit tests, migration, schema drift, seed, typecheck, and compile together. A failing test fails the deploy.

**Amendment — standalone `tsc --noEmit` dropped from the chain.** The original plan ran `tsc` as a separate first step. `tsconfig.json` includes `next-env.d.ts` and `.next/types/**/*.ts`, both of which are *generated by `next build`*. Running `tsc` before the build would fail on missing generated types; running it after duplicates work `next build` already does, since Next typechecks the project during a production build.

Typechecking is therefore performed by `next build`. The `typecheck` script is retained for targeted use but is not in the deploy chain.

**Known gap:** `next build` does not typecheck `*.test.ts` (excluded from the build graph), and Vitest transpiles without typechecking. Type errors in test files therefore surface as runtime failures rather than compile errors. Accepted — test files are small and their failures are loud.

Chosen over a separate GitHub Actions workflow: with no local runtime, every additional piece of remote infrastructure is another thing that can only be debugged through the same slow loop. Folding checks into the build that already exists adds nothing new to configure.

**Accepted cost:** slower builds, and unit-test failures block deployment rather than merely reporting. Given the spec requires unit tests for trip logic and those tests cannot run anywhere else, blocking is the correct behaviour.

---

## ADR-021 — Feature branches, `main` stays deployable

**Date:** 2026-07-30 · **Status:** **Accepted** (user-approved)

Work is pushed to feature branches (`phase-1`, `phase-2`, …) on `github.com/danielgorman12/CRM-Fluent`. Vercel builds these as previews. `main` is merged only from a branch whose preview built and rendered correctly.

Under ADR-018 a broken push cannot be caught before it lands. Branch previews mean a failed build costs a preview URL rather than the demo deployment.

---

## ADR-016 — No AI provider in the competition build

**Date:** 2026-07-30 · **Status:** **Accepted** (user-approved)

No API key is available. The build ships with `AI_PROVIDER=none`.

What still gets built:
- `lib/ai/provider.ts` — the provider abstraction, with `anthropic` and `openai` branches present but unexercised.
- `lib/ai/schemas.ts` — Zod schemas for every AI response shape.
- Deterministic narrative templates for trip summaries, day objectives, inclusion reasons, pre-trip actions, and report summaries.

What does not get built: live model calls, AI-authored prose, AI free-text parsing.

This is a low-cost decision precisely because of ADR-008: the deterministic engine already produces the complete plan, so removing the AI layer removes narrative polish, not capability. Frees ~1h against a tight budget.

**Consequence for the demo:** no "AI interpretation" badges will appear, since nothing is AI-authored. The Interpretation badge on the whitespace section stays — those are rule-derived inferences and still need distinguishing from hard counts.

**Reversal:** set `AI_PROVIDER` and add a key; the narrative merge points are already in place.
