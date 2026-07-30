import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Ordered pipeline — `order` drives both the funnel and the pipeline-progress UI.
const STAGES = [
  { name: "Identified", order: 1, category: "ACTIVE", colorHex: "#94a3b8" },
  { name: "Outreach Sent", order: 2, category: "ACTIVE", colorHex: "#60a5fa" },
  { name: "Seller Responded", order: 3, category: "ACTIVE", colorHex: "#38bdf8" },
  { name: "Initial Discussions", order: 4, category: "ACTIVE", colorHex: "#34d399" },
  { name: "Advanced Discussions", order: 5, category: "ACTIVE", colorHex: "#facc15" },
  { name: "Pre-LOI", order: 6, category: "ACTIVE", colorHex: "#fb923c" },
  { name: "LOI Submitted", order: 7, category: "ACTIVE", colorHex: "#f97316" },
  { name: "LOI Accepted", order: 8, category: "ACTIVE", colorHex: "#ef4444" },
  { name: "Closed Won", order: 9, category: "CLOSED_WON", colorHex: "#16a34a", isTerminal: true },
  { name: "Closed Lost", order: 10, category: "CLOSED_LOST", colorHex: "#71717a", isTerminal: true },
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
// the source of truth for who can sign in. Update here and re-run the seed
// (or insert directly) to add a new team member.
const TEAM_MEMBERS = [
  { email: "daniel.gorman@fluentcorp.com", name: "Daniel Gorman", title: "Portfolio Controller" },
];

// A handful of fictional sample prospects for local UI development/testing —
// lat/lng are hardcoded (rather than geocoded) so the seed stays fast and
// deterministic offline.
const SAMPLE_PROSPECTS = [
  {
    name: "Meridian Clinic Systems",
    verticalName: "Healthcare IT",
    stageName: "Advanced Discussions",
    city: "Nashville",
    region: "TN",
    country: "USA",
    latitude: 36.1627,
    longitude: -86.7816,
    currentARR: 4200000,
    currentEBITDA: 1100000,
    currentEBITDAMargin: 26,
    grossRetentionPct: 92,
    netRetentionPct: 104,
    description: "EHR and billing software for independent physical therapy clinics.",
  },
  {
    name: "CivicWorks Permitting",
    verticalName: "Government & Public Sector",
    stageName: "Outreach Sent",
    city: "Boise",
    region: "ID",
    country: "USA",
    latitude: 43.615,
    longitude: -116.2023,
    currentARR: 1800000,
    currentEBITDA: 350000,
    currentEBITDAMargin: 19,
    grossRetentionPct: 95,
    netRetentionPct: 101,
    description: "Permitting and code-enforcement software for small municipal governments.",
  },
  {
    name: "DockSide Logistics Suite",
    verticalName: "Transportation & Logistics",
    stageName: "LOI Submitted",
    city: "Savannah",
    region: "GA",
    country: "USA",
    latitude: 32.0809,
    longitude: -81.0912,
    currentARR: 6100000,
    currentEBITDA: 2000000,
    currentEBITDAMargin: 33,
    grossRetentionPct: 90,
    netRetentionPct: 108,
    description: "Yard and dock scheduling software for regional freight terminals.",
  },
  {
    name: "ParishConnect",
    verticalName: "Nonprofit & Association Management",
    stageName: "Closed Won",
    city: "Cincinnati",
    region: "OH",
    country: "USA",
    latitude: 39.1031,
    longitude: -84.512,
    currentARR: 2900000,
    currentEBITDA: 950000,
    currentEBITDAMargin: 33,
    grossRetentionPct: 96,
    netRetentionPct: 103,
    description: "Membership and donation management software for religious organizations.",
  },
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

  const existingProspectCount = await prisma.prospect.count();
  if (existingProspectCount === 0) {
    const dealOwner = await prisma.user.findUniqueOrThrow({
      where: { email: TEAM_MEMBERS[0].email },
    });

    for (const sample of SAMPLE_PROSPECTS) {
      const [vertical, stage] = await Promise.all([
        prisma.vertical.findUniqueOrThrow({ where: { name: sample.verticalName } }),
        prisma.stageDefinition.findUniqueOrThrow({ where: { name: sample.stageName } }),
      ]);

      await prisma.prospect.create({
        data: {
          name: sample.name,
          description: sample.description,
          verticalId: vertical.id,
          city: sample.city,
          region: sample.region,
          country: sample.country,
          latitude: sample.latitude,
          longitude: sample.longitude,
          geocodeStatus: "MANUAL",
          geocodeSource: "manual",
          geocodedAt: new Date(),
          currentARR: sample.currentARR,
          currentEBITDA: sample.currentEBITDA,
          currentEBITDAMargin: sample.currentEBITDAMargin,
          grossRetentionPct: sample.grossRetentionPct,
          netRetentionPct: sample.netRetentionPct,
          currentStageId: stage.id,
          dealOwnerId: dealOwner.id,
          createdById: dealOwner.id,
          stageHistory: {
            create: { stageId: stage.id, changedById: dealOwner.id },
          },
        },
      });
    }
  }

  console.log(
    `Seeded ${STAGES.length} stages, ${VERTICALS.length} verticals, ${TEAM_MEMBERS.length} team members, ${existingProspectCount === 0 ? SAMPLE_PROSPECTS.length : 0} sample prospects.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
