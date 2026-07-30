# Changelog

Updated after every phase. Build, lint, typecheck, and test results are recorded verbatim — no result is entered here unless the command was actually run.

---

## Phase 0 — Discovery and planning · 2026-07-30

### Done
- Audited the repository at `464d0a0` (2 commits: initial Phase 1 build, deploy migration fix).
- Catalogued framework, dependencies, database setup, auth, styling, mapping, geo utilities, AI integrations, components, env vars, and scripts.
- Established that no test framework, no geospatial computation, no clustering, no AI integration, and no `typecheck`/`format`/`test` scripts exist.
- Authored `PRODUCT_SPEC.md`, `DATA_MODEL.md`, `GEOGRAPHIC_REPORTS.md`, `TRIP_AGENT_SPEC.md`, `BUILD_PLAN.md`, `DECISIONS.md`, `DEMO_SCRIPT.md`.

### Checks run
| Command | Result |
|---|---|
| `git ls-tree -r origin/main` | 89 files enumerated |
| `node -v` / `npm -v` | **not found — Node.js is not installed on this machine** |
| `npm install` | **not run** (no Node) |
| `npm run lint` | **not run** (no Node) |
| `npm run build` | **not run** (no Node) |

No build, lint, or test result is claimed for this phase. Nothing was executed.

### Repository state changed
- Fetched `origin/main` and checked it out into a previously empty working tree (the local clone had no commits).
- Added `docs/` — documentation only. **No product code, schema, or dependency was modified.**

### Blocking items — all resolved
| Item | Resolution | ADR |
|---|---|---|
| Node.js absent | **No local runtime at all** — Vercel is the build/run/verify environment | ADR-018 |
| Database target | Existing hosted Postgres on the Vercel project; contents dropped | ADR-018 |
| Migrations | Hand-written SQL + build-time `migrate diff` drift guard | ADR-019 |
| Verification | `tsc`, `vitest`, migrate, drift, seed, build — all in the build script | ADR-020 |
| Branching | `phase-N` branches; `main` merged only from a green preview | ADR-021 |
| Authentication | `AUTH_DEMO_MODE=1`, `NODE_ENV` guard removed | ADR-015 amended |
| AI provider | None available — deterministic narrative only | ADR-016 |
| Deal-evaluation models | Dropped — demo will not be asked about deal quality | ADR-004 |
| Stage ranking | Positive Response above LOI/DD — confirmed | ADR-017 |

### Late change: no local runtime

Discovered after the plan was drafted. ADR-013 and ADR-014 superseded by ADR-018.

Net schedule effect: ADR-016 removed ~1h from Phase 6; ADR-018 added ~0.5h to Phase 1 and makes every subsequent phase's verification slower. **Revised total ~18.5h against ~18h of capacity** — the MVP cutoff is now expected to be applied during Phase 6–7, not held as contingency.

### Next
Phase 1 — Foundation and geographic data, on approval.
