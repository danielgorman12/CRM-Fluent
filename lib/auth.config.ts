import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { demoMode, demoUserEmail, resolveAuthSecret, ssoConfigured } from "@/lib/demo-mode";

type Provider = NextAuthConfig["providers"][number];

export { demoMode, ssoConfigured };

const providers: Provider[] = [];

if (ssoConfigured) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  );
}

if (demoMode) {
  providers.push(
    Credentials({
      id: "demo",
      name: "Demo",
      credentials: {},
      // Nothing to verify here — the allow-list in lib/auth.ts is the real
      // gate: the resolved email must match an active, pre-seeded User row,
      // so this can only ever sign in as a real team member.
      authorize: () => ({ id: "demo-user", email: demoUserEmail, name: "Demo User" }),
    }),
  );
}

// Edge/proxy-safe config: providers + pages only, no database access.
// The full config (lib/auth.ts) adds the Prisma-backed allow-list and
// session callbacks on top of this for use in Route Handlers/Server Components.
export const authConfig: NextAuthConfig = {
  providers,
  // Must be set here rather than in lib/auth.ts: proxy.ts builds its own
  // NextAuth instance from this config, and both need the same secret or
  // session cookies written by one won't verify in the other.
  secret: resolveAuthSecret(),
  // Auth.js refuses to build callback URLs from the request Host header unless
  // told to trust it. It infers this on Vercel, but not behind other proxies or
  // in a plain `next start`, where sign-in then fails with UntrustedHost.
  // Setting it explicitly keeps sign-in working wherever this is hosted.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
};
