# CRM-Fluent

An M&A sourcing and acquisition-evaluation platform for the Fluent Software Group M&A team — tracking Vertical Market Software acquisition targets from initial identification through LOI and close.

Phase 1 covers prospect profiles, VMS scorecards, acquisition theses, seller/succession intelligence, forecasting, valuation, sourcing activity tracking, an outreach/conversion dashboard, and a geographic sourcing map — all with manually-entered data. Excel "databook" auto-extraction is planned for Phase 2.

## Stack

Next.js (App Router, TypeScript) · Prisma + Postgres · Auth.js with Microsoft Entra ID SSO · Tailwind + shadcn/ui · react-leaflet + OpenStreetMap · Recharts.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start a local Postgres instance (no Docker required):
   ```bash
   npx prisma dev
   ```
   Copy the printed connection string into `.env` as `DATABASE_URL` (copy `.env.example` to `.env` first).
3. Apply the schema and seed the essential lookup data (pipeline stages, verticals, team members):
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
4. Optionally load fictional demo prospects for UI testing (local only — refuses to run in production):
   ```bash
   npx tsx prisma/seed-sample-data.ts
   ```
5. Set up Microsoft Entra ID sign-in (see below), then fill in the `AUTH_*` values in `.env`.
6. Run the dev server:
   ```bash
   npm run dev
   ```

### Microsoft Entra ID (Azure AD) app registration

Team members sign in with their Fluent Microsoft 365 accounts. To enable this for local development:

1. Azure Portal → **Entra ID** → **App registrations** → **New registration**.
2. Name it `CRM-Fluent (Local Dev)`, single tenant.
3. Redirect URI (Web): `http://localhost:3000/api/auth/callback/microsoft-entra-id`.
4. **Certificates & secrets** → new client secret → copy the value immediately.
5. Set in `.env`:
   - `AUTH_MICROSOFT_ENTRA_ID_ID` — Application (client) ID
   - `AUTH_MICROSOFT_ENTRA_ID_SECRET` — the client secret value
   - `AUTH_MICROSOFT_ENTRA_ID_ISSUER` — `https://login.microsoftonline.com/<tenant-id>/v2.0/`

For the deployed environment, add a second **Redirect URI** to the same app registration:
`https://<your-vercel-domain>/api/auth/callback/microsoft-entra-id`

### Adding team members

Phase 1 has no self-serve provisioning — only users seeded in `prisma/seed.ts` (`TEAM_MEMBERS`) can sign in, in every environment. Add a name/email there, commit, and the next deploy grants access (or run `npx prisma db seed` locally).

## Deployment

Deploys to Vercel from the repo root (no Root Directory override needed).

**`DATABASE_URL` is the only variable you must set** — Vercel's Neon integration (Storage → Connect Database) sets it for you. Use the **pooled** connection string; the unpooled one will exhaust the connection limit.

With nothing else configured the app comes up in **demo mode**: a passwordless "Enter demo" button, and fictional prospects seeded so the map and dashboard aren't empty.

> ⚠️ Demo mode means **anyone with the URL can enter**. It's for hackathons and demos, not real data. Adding the three `AUTH_MICROSOFT_ENTRA_ID_*` variables switches it off automatically.

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Required. Pooled Postgres connection string. |
| `AUTH_SECRET` | Signs session cookies. Required for real use; in demo mode one is derived from `DATABASE_URL` so a missing value doesn't break the demo. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | Application (client) ID. |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | Client secret value. |
| `AUTH_MICROSOFT_ENTRA_ID_ISSUER` | `https://login.microsoftonline.com/<tenant-id>/v2.0/` |
| `ENABLE_DEMO_LOGIN` | `true`/`false` to force demo login on or off, overriding the default. |
| `DEMO_USER_EMAIL` | Which seeded team member the demo button signs in as. Defaults to the first entry in `prisma/seed.ts`. |
| `SEED_DEMO_DATA` | `true`/`false` to force demo prospects on or off, overriding the default. |

Entra ID is only registered as a provider when **all three** of its values are present. A partially-configured provider fails Auth.js validation at startup and breaks sign-in entirely — including the demo button — so it's all-or-nothing by design.

Even in demo mode, sign-in still requires the resolved email to match an active user seeded in `prisma/seed.ts`. Demo mode removes the password, not the allow-list.

`npm run build` runs `prisma generate && prisma migrate deploy && prisma db seed && tsx prisma/seed-sample-data.ts` before building, so each deploy applies pending migrations and ensures the lookup data exists. Every step is idempotent, and the demo-prospect step no-ops when demo mode is off.

Note that this means **the build needs a reachable database**. A missing or wrong `DATABASE_URL` fails the build rather than deploying a site whose every page errors.
