import { createHash } from "node:crypto";

// Single source of truth for whether this deployment is a demo.
//
// Server-only, and dependency-free apart from node:crypto, so both the Next.js
// app and the build-time seed scripts can import it.

function flag(name: string): boolean | undefined {
  const value = process.env[name];
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

// Entra ID is only usable when all three values are present. Auth.js validates
// providers at startup, so registering a half-configured one throws
// InvalidEndpoints and breaks sign-in entirely — including the demo fallback.
export const ssoConfigured = Boolean(
  process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
    process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
    process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
);

// Demo mode is the automatic fallback when there's no SSO: without it nobody
// could sign in at all, so the deployment would be unusable. Adding real SSO
// credentials turns it off by itself — no cleanup step to forget.
//
// Override either way with ENABLE_DEMO_LOGIN=true|false.
export const demoMode = flag("ENABLE_DEMO_LOGIN") ?? !ssoConfigured;

// Fictional prospects, so a demo deployment's map and dashboard aren't empty.
// Follows demo mode unless SEED_DEMO_DATA says otherwise.
export const seedDemoData = flag("SEED_DEMO_DATA") ?? demoMode;

// Which seeded team member the demo button signs in as.
export const demoUserEmail = process.env.DEMO_USER_EMAIL ?? "daniel.gorman@fluentcorp.com";

// Auth.js needs a secret to sign session cookies and refuses to start in
// production without one. In demo mode a missing AUTH_SECRET would turn a
// forgotten environment variable into a hard crash, so derive one instead:
// signing keys add no protection when sign-in is already passwordless and open
// to anyone with the link.
//
// Derived (not hardcoded) so it stays unique per deployment and out of the
// repo, and stable across instances so sessions survive. Once SSO is
// configured this returns undefined and Auth.js raises its own clear error —
// a real deployment must set AUTH_SECRET properly.
export function resolveAuthSecret(): string | undefined {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (!demoMode) return undefined;

  const material = process.env.DATABASE_URL ?? "crm-fluent-demo";
  return createHash("sha256").update(`crm-fluent-demo-mode:${material}`).digest("base64");
}
