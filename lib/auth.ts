import NextAuth from "next-auth";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    // Phase 1 has no self-serve provisioning: only pre-seeded, active team
    // members (see prisma/seed.ts) may sign in, matched by their Entra UPN.
    async signIn({ user }) {
      if (!user.email) return false;
      const seeded = await prisma.user.findUnique({ where: { email: user.email } });
      return !!seeded?.isActive;
    },
    async session({ session }) {
      if (session.user?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.title = dbUser.title;
        }
      }
      return session;
    },
  },
});
