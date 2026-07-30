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
3. Apply the schema and seed sample data:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
4. Set up Microsoft Entra ID sign-in (see below), then fill in the `AUTH_*` values in `.env`.
5. Run the dev server:
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

A separate app registration (with the production domain as its redirect URI) is needed for the deployed environment.

### Adding team members

Phase 1 has no self-serve provisioning — only users seeded in `prisma/seed.ts` (`TEAM_MEMBERS`) can sign in. Add a name/email there and re-run `npx prisma db seed` to grant access.

## Deployment

Deploys to Vercel. Requires a Postgres database (e.g. Neon via Vercel's Postgres integration) and the same `DATABASE_URL` / `AUTH_*` environment variables set in the Vercel project settings, plus a production Entra ID app registration. Use Neon's **pooled** connection string for `DATABASE_URL` in production — serverless functions open a fresh connection per invocation, and the unpooled URL will exhaust Neon's connection limit under concurrent traffic.

`npm run build` runs `prisma generate` first automatically, so no extra Vercel build-command configuration is needed.
