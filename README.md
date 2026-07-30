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

Environment variables in the Vercel project:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string. Use the **pooled** URL — the unpooled one will exhaust the connection limit. Vercel's Neon integration (Storage → Connect Database) sets this automatically. |
| `AUTH_SECRET` | Yes | Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | For SSO | Application (client) ID |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | For SSO | Client secret value |
| `AUTH_MICROSOFT_ENTRA_ID_ISSUER` | For SSO | `https://login.microsoftonline.com/<tenant-id>/v2.0/` |
| `ENABLE_DEMO_LOGIN` | No | `true` adds a passwordless "Continue as demo user" button. **Anyone with the URL can then sign in** — demo/hackathon use only. |
| `DEMO_USER_EMAIL` | No | Which seeded team member the demo button signs in as. Defaults to the first entry in `prisma/seed.ts`. |
| `SEED_DEMO_DATA` | No | `true` seeds the fictional demo prospects and outreach history on deploy, so the map and dashboard aren't empty. Leave unset for real use. |

At least one sign-in method must be configured. The three `AUTH_MICROSOFT_ENTRA_ID_*` values are only registered as a provider when **all three** are present — a partially-configured provider would otherwise fail Auth.js validation at startup and break sign-in entirely, including the demo button. If neither method is configured, the login page says so explicitly rather than failing silently.

`npm run build` runs `prisma generate && prisma migrate deploy && prisma db seed && tsx prisma/seed-sample-data.ts` before building, so each deploy applies pending migrations and ensures the stage/vertical/team-member lookup data exists. Every step is idempotent. The demo-prospect step no-ops unless `SEED_DEMO_DATA=true`, so fictional companies can't reach a real database.
