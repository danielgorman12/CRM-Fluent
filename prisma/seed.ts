import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// This seed runs in EVERY environment, including production (it's part of
// the Vercel build command) — it must only ever contain real, essential
// lookup data. Fictional demo prospects live in seed-sample-data.ts instead,
// which is never wired into the build.

// Ordered pipeline — `order` drives both the funnel and the pipeline-progress
// UI, and `colorHex` is the single source of truth for stage colour across the
// map, board and donut.
//
// Colours run cool-to-warm on the Fluent brand blues, so progress reads as
// heat: grey-blue when identified, brand blue mid-pipeline, amber/terracotta as
// an LOI approaches, green on close. Re-running the seed updates existing rows.
const STAGES = [
  { name: "Identified", order: 1, category: "ACTIVE", colorHex: "#9aa3b8" },
  { name: "Outreach Sent", order: 2, category: "ACTIVE", colorHex: "#8fb6ec" },
  { name: "Seller Responded", order: 3, category: "ACTIVE", colorHex: "#5b9bf0" },
  { name: "Initial Discussions", order: 4, category: "ACTIVE", colorHex: "#2f7be0" },
  { name: "Advanced Discussions", order: 5, category: "ACTIVE", colorHex: "#1764d7" },
  { name: "Pre-LOI", order: 6, category: "ACTIVE", colorHex: "#e8a33d" },
  { name: "LOI Submitted", order: 7, category: "ACTIVE", colorHex: "#dc7a2e" },
  { name: "LOI Accepted", order: 8, category: "ACTIVE", colorHex: "#c4553d" },
  { name: "Closed Won", order: 9, category: "CLOSED_WON", colorHex: "#1e7a46", isTerminal: true },
  { name: "Closed Lost", order: 10, category: "CLOSED_LOST", colorHex: "#8a8a82", isTerminal: true },
] as const;

const VERTICALS = [
  "Healthcare IT",
  "Government & Public Sector",
  "Field Services",
  "Legal Tech",
  "Property Management",
  "Nonprofit & Association Management",
  "Transportation & Logistics",
  "Education",
];

// Seeded M&A team — Phase 1 has no self-serve provisioning, so this list is
// the source of truth for who can sign in, in every environment including
// production. Add a real team member here and re-run the seed to grant access.
const TEAM_MEMBERS = [
  { email: "daniel.gorman@fluentcorp.com", name: "Daniel Gorman", title: "Portfolio Controller" },
];

async function main() {
  for (const stage of STAGES) {
    await prisma.stageDefinition.upsert({
      where: { name: stage.name },
      update: stage,
      create: stage,
    });
  }

  for (const name of VERTICALS) {
    await prisma.vertical.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const member of TEAM_MEMBERS) {
    await prisma.user.upsert({
      where: { email: member.email },
      update: member,
      create: member,
    });
  }

  console.log(`Seeded ${STAGES.length} stages, ${VERTICALS.length} verticals, ${TEAM_MEMBERS.length} team members.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
