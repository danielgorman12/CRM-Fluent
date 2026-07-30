# Build Plan

**Status:** Phase 0 complete, awaiting approval for Phase 1
**Deadline:** two days
**Last updated:** 2026-07-30

This document is editable and is the working source of truth for scope. Update it after every phase.

## Repository baseline

| Aspect | Finding |
|---|---|
| Framework | Next.js **16.2.12**, App Router, React 19.2.4, TypeScript 5 |
| Styling | Tailwind v4 (`@tailwindcss/postcss`), shadcn v4 on **`@base-ui/react`** — *not* Radix. Components use `render={<Link/>}`, not `asChild`. |
| UI kit present | badge, button, card, checkbox, dialog, dropdown-menu, input, label, select, separator, sonner, table, tabs, textarea |
| Database | Prisma **7.9.1** + Postgres via `@prisma/adapter-pg`, client generated to `lib/generated/prisma` |
| Auth | Auth.js v5 beta, **Microsoft Entra ID SSO only**, allow-list from seeded users, `proxy.ts` guards all routes |
| Mapping | `leaflet` 1.9.4 + `react-leaflet` 5.0.0, OSM tiles, `CircleMarker`. No clustering. |
| Geo utilities | `lib/geocode.ts` — Nominatim forward geocoding only. **No distance, clustering, or routing code exists.** |
| AI | **None.** No SDK, no provider config, no `AI_*` env vars. |
| Charts | Recharts 3.10.1 |
| Validation | Zod 4.4.3, hand-rolled `FormData` parsing (no React Hook Form) |
| Tests | **None.** No Vitest/Jest, no test script. |
| Scripts | `dev`, `build`, `start`, `lint`. **No `typecheck`, `format`, or `test`.** |
| Local toolchain | **Node.js is not installed on this machine.** `node`, `npm`, `npx` all absent; `node_modules` absent. |

**Verdict: keep the stack, replace the domain.** The infrastructure choices are sound and match the recommended stack. The *domain model* is built for a different product (deal evaluation: scorecards, theses, valuations, forecasts) and cannot express geography-first sourcing — it lacks employee count, year established, street address, postal code, touch-base period, last-contacted, next-follow-up, general notes, trips, and reports, and its mapping enum describes geocoder outcome rather than location confidence.

### There is no local runtime — Vercel is the build environment

**No Node.js exists on this machine and none will be installed** (ADR-018). There is no local `npm`, dev server, typechecker, test runner, or Prisma CLI. Everything is verified by pushing to a branch and reading the Vercel build.

### Working model

| | |
|---|---|
| **Verification loop** | `git push` → Vercel build → read logs. ~2–4 min per iteration |
| **Commit rhythm** | Large, carefully-reviewed batches. Code is read closely before pushing because it cannot be compiled first |
| **Branch** | `phase-N` branches on `danielgorman12/CRM-Fluent`; `main` merged only from a green preview (ADR-021) |
| **Database** | Existing hosted Postgres on the Vercel project; contents dropped by the baseline migration (approved) |
| **Migrations** | Hand-written SQL + `prisma migrate diff --exit-code` drift guard (ADR-019) |
| **UI verification** | Browser tools against the preview URL — map render, filters, console errors |
| **Tests** | `vitest run` inside the build; a failing test fails the deploy (ADR-020) |

### Resolved setup decisions

| Question | Decision | ADR |
|---|---|---|
| Runtime | ~~Local Node~~ → **Vercel only** | 018 (supersedes 013) |
| Database | ~~Local `prisma dev`~~ → **hosted Postgres on Vercel** | 018 (supersedes 014) |
| Migrations | Hand-written SQL + build-time drift check | 019 |
| Verification | Folded into the build script | 020 |
| Branching | Feature branches, `main` stays deployable | 021 |
| Authentication | `AUTH_DEMO_MODE=1`, **no** `NODE_ENV` guard | 015 (amended) |
| AI provider | **None.** Deterministic narrative only | 016 |
| Stage ranking | Positive Response above LOI/DD | 017 |

### AGENTS.md warning, taken seriously
`AGENTS.md` states this Next.js version has breaking changes versus training data and directs agents to read `node_modules/next/dist/docs/` before writing code. Those docs are not yet on disk. **Phase 1 begins by reading them.** The `render={...}` prop already observed in `components/ui/button.tsx` confirms base-ui conventions differ from familiar shadcn/Radix patterns.

---

## Dependencies to add

| Package | Purpose | Phase |
|---|---|---|
| `date-fns` | all date arithmetic, follow-up windows | 1 |
| `vitest` | unit tests for geo + trip logic (**required** by spec) | 1 |
| `@tanstack/react-table` | Sourcing table: sort, filter, selection | 2 |
| `supercluster` | map marker clustering | 3 |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Pipeline kanban, itinerary reorder | 7 |

No AI SDK is installed (ADR-016).

**`supercluster` over `react-leaflet-markercluster`:** the latter is a wrapper whose React 19 / react-leaflet 5 compatibility is unverified, and a broken map is a demo-ending failure. `supercluster` is a pure data structure — feed it points, get back clusters, render them as ordinary `CircleMarker`s we already control. No wrapper compatibility risk, and the same index can drive both the map and the report drill-through.

**No `react-hook-form`:** the existing forms use server actions with `FormData` + Zod, which works and is fewer moving parts under deadline. Not worth the churn.

---

## Phases

Estimates assume two ~9-hour days. Cumulative total is deliberately below capacity to leave room for the unknowns in a Next.js version with documented breaking changes.

### Phase 1 — Foundation and geographic data · ~3.5h · Day 1

*(+0.5h vs. the local-runtime plan: hand-written migration SQL and a
verification round-trip that cannot be short-circuited locally.)*

- [ ] Add deps to `package.json` by hand (no `npm install` available to resolve them)
- [ ] Rewrite `build` script per ADR-020; add `typecheck`/`test` scripts; Vitest config
- [ ] **Push an empty-change verification build first** — confirms the toolchain,
      Node version, and `DATABASE_URL` work before any real code depends on them
- [ ] `lib/domain/stages.ts` — 9 stages, colours, order, category, stage scores
- [ ] `lib/domain/mapping-status.ts`, `lib/domain/types.ts`
- [ ] New Prisma schema per `DATA_MODEL.md`
- [ ] **Hand-written** baseline migration SQL + drift check in the build (ADR-019)
- [ ] `lib/filters/{schema,url,apply}.ts` — the shared filter model
- [ ] `prisma/seed.ts` (lookup) + `prisma/seed-demo.ts` (48 companies, notes, activity)
- [ ] App shell: Sourcing / Map / Pipeline navigation
- [ ] `AUTH_DEMO_MODE` credentials provider (ADR-015), guarded against production

**Exit:** the preview deployment builds green (typecheck + tests + migration + drift check + seed + compile), demo data is visible, filters round-trip through the URL, demo sign-in works.

### Phase 2 — Sourcing data layer · ~2.5h · Day 1

- [ ] Sourcing table (TanStack): all 14 columns, sort, name search, row selection
- [ ] Filter bar wired to the shared model + URL
- [ ] Inline stage change (with Touch Base Later → period modal → follow-up date)
- [ ] Inline lead-owner assignment
- [ ] "Apply to Map" / "Send to Trip Agent" actions
- [ ] Company profile: info, location + mapping status, opportunity panel
- [ ] Call notes + general notes create/list; activity timeline
- [ ] Server actions with `revalidatePath` across all three sections

**Exit:** every field in `PRODUCT_SPEC` §7–8 is visible and editable; a stage change in Sourcing is visible on Map and Pipeline.

### Phase 3 — Interactive map · ~2.0h · Day 1

- [ ] World/country/region/metro views; stage-coloured markers
- [ ] `supercluster` zoom-based clustering
- [ ] Marker popup with all 10 required fields + visit priority + profile link
- [ ] Map filter panel bound to the same shared filter model
- [ ] Mapping-status counters + unmapped review queue
- [ ] Company and cluster selection → feeds reports and the agent

**Exit:** filters change markers, counters, and downstream candidate sets simultaneously; unmapped companies never break the map.

### Phase 4 — Geographic reports · ~3.0h · Day 1 → Day 2

- [ ] `lib/geo/{haversine,travel,cluster,cluster-naming}.ts` + unit tests
- [ ] All eight report sections (`GEOGRAPHIC_REPORTS.md` §5) + unit tests
- [ ] Report UI in the order of §8, with Recharts distributions
- [ ] Opportunity cluster cards with 4-component priority breakdown
- [ ] Whitespace section under an Interpretation badge
- [ ] Drill-through: every metric → Sourcing / Map / cluster / agent

**Exit:** a report for Chicago, Toronto, and "world" each render credibly and every figure is clickable.

### Phase 5 — Sourcing-trip engine · ~3.5h · Day 2

- [ ] `lib/trip/scoring-config.ts` — all weights in one file
- [ ] L1 candidates + structured exclusions
- [ ] L2 six-factor scoring with breakdowns
- [ ] L3 day grouping · L4 nearest-neighbour + 2-opt · L4b schedule walk
- [ ] L5 validation with 13 checks
- [ ] `TripPlan` schema
- [ ] **Unit tests for all three demo scenarios** + determinism + boundary cases

**Exit:** `npm test` green; all three scenarios produce plans matching their asserted properties; Scenario 3 produces an honest weak verdict.

### Phase 6 — Trip agent interface · ~2.5h · Day 2

- [ ] Collapsible agent panel in the Map section
- [ ] Structured parameter form + free-text prompt box
- [ ] Free-text → parameter parsing with keyword fallback; parsed params shown editable
- [ ] Itinerary rendering: summary, ranked companies with breakdowns, day-by-day stops
- [ ] Pre-trip actions, exclusions, risks/limitations panels
- [ ] Refinement controls + regenerate; pins preserved
- [ ] Free-text → parameter parsing via keyword/regex only (ADR-012, ADR-016)
- [ ] `lib/ai/` provider abstraction + Zod schemas, shipped unexercised
- [ ] Deterministic narrative templates for summary, day objectives, inclusion reasons

**Exit:** the full demo path §22 runs end to end with `AI_PROVIDER=none`.

### Phase 7 — Pipeline · ~1.0h · Day 2

- [ ] Four-column kanban (Data Received / IOI / LOI / DD)
- [ ] `@dnd-kit` drag-and-drop stage change
- [ ] Card: owner, next action, follow-up date, overdue alert
- [ ] Closed Won / Closed Lost actions
- [ ] Cross-view sync verified

### Phase 8 — Competition polish · ~1.5h · Day 2

- [ ] Cross-view consistency pass against `PRODUCT_SPEC` §5 table
- [ ] Run all three trip scenarios manually
- [ ] Report visual hierarchy pass
- [ ] Demo reset script
- [ ] Responsive check
- [ ] `format`, `lint`, `typecheck`, `test`, production `build` — all recorded with real output
- [ ] `DEMO_SCRIPT.md` rehearsed; README rewritten

**Total: ~18h across two ~9h days** (ADR-016 removed ~1h of AI work from Phase 6). Still tight — the MVP cutoff below is expected to be used, not held in reserve.

---

## MVP cutoff

If time runs short, cut in this order — **top of the list goes first**:

*(The AI narrative layer was already cut by ADR-016 and is no longer on this list.)*

1. Phase 7 Pipeline drag-and-drop (static 4-column read-only view instead) — saves 0.7h
2. Saved reports / saved trips persistence (generate-and-display only) — saves 0.5h
3. CSV export — saves 0.3h
4. Whitespace section reduced to the two strongest rules — saves 0.4h
5. Map draw-a-region selection (keep click-to-select cluster) — saves 0.5h
6. Free-text prompting (keep the structured form, which is more demoable anyway) — saves 0.5h

**Never cut:** shared filter model · mapping-status honesty · clustering · opportunity clusters · six-factor scoring with breakdowns · schedule construction · validation warnings · exclusions with reasons · refinement + regenerate · the three tested scenarios.

Rationale: the two Priority-1/2 deliverables are the geographic reports and the trip agent. Everything on the cut list is either a Priority-5 feature, additive polish, or a second path to something the structured UI already does.

---

## Verification

There is no local runtime. Verification is the Vercel build (ADR-018, ADR-020):

```
tsc --noEmit
vitest run
prisma generate
prisma migrate deploy
prisma migrate diff --exit-code      # schema/SQL drift guard
prisma db seed
next build
```

Every phase exit is a green preview build plus a browser pass over the preview URL. No phase is reported complete on unrun checks, and no build result is entered in `CHANGELOG.md` unless the Vercel log was actually read.

**Because `lint` is not in this chain** (ESLint is slow and its failures are rarely demo-affecting), it runs as a separate pass during Phase 8 rather than blocking every deploy.
