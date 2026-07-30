import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

type Provider = NextAuthConfig["providers"][number];

// Auth.js validates every registered provider at startup, and a provider with
// missing config throws InvalidEndpoints — which takes down the whole auth
// system, not just that one provider. So only register Entra ID once its
// credentials actually exist; otherwise a deployment without them (e.g. a demo
// before the Azure app registration is approved) can't sign in at all.
export const entraLoginEnabled = Boolean(
  process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
    process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
    process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
);

// Demo sign-in for hackathon/demo deployments. Must be turned on explicitly
// via ENABLE_DEMO_LOGIN=true — never on by default, in any environment.
//
// This bypasses SSO but NOT authorization: the `signIn` callback in lib/auth.ts
// still requires the resolved email to match an active, pre-seeded User row,
// so it can only ever log in as a real team member.
export const demoLoginEnabled = process.env.ENABLE_DEMO_LOGIN === "true";

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL ?? "daniel.gorman@fluentcorp.com";

const providers: Provider[] = [];

if (entraLoginEnabled) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  );
}

if (demoLoginEnabled) {
  providers.push(
    Credentials({
      id: "demo",
      name: "Demo",
      credentials: {},
      // No secret to check — the allow-list in lib/auth.ts is the real gate.
      authorize: () => ({ id: "demo-user", email: DEMO_EMAIL, name: "Demo User" }),
    }),
  );
}

// Edge/proxy-safe config: providers + pages only, no database access.
// The full config (lib/auth.ts) adds the Prisma-backed allow-list and
// session callbacks on top of this for use in Route Handlers/Server Components.
export const authConfig: NextAuthConfig = {
  providers,
  pages: {
    signIn: "/login",
  },
};
