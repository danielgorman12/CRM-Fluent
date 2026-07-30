import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Keep the per-instance connection pool small and let queries queue instead of
// opening a connection each. Pages like the dashboard fire several queries at
// once, and without a cap that's enough concurrent connections to be refused —
// by the lightweight local `prisma dev` server, and by a serverless-hosted
// Postgres where every warm instance holds its own pool. Queuing a few
// milliseconds is much cheaper than a dropped connection.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  // Don't hold connections open indefinitely — serverless hosts (and Neon)
  // close idle connections themselves, which would otherwise leave dead
  // clients in the pool for the next request to pick up.
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
