import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

// Fictional prospects for local development and demo deployments, so the map,
// dashboard funnel, and prospect list have something to show.
//
// Runs automatically in local dev. On a deployed environment it only runs when
// SEED_DEMO_DATA=true is set explicitly — so fake companies can't land in a
// real production database by accident. Run manually with:
//   npx tsx prisma/seed-sample-data.ts
// Requires prisma/seed.ts to have already run (stages/verticals/team members).

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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
  const isDeployed = Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";
  if (isDeployed && process.env.SEED_DEMO_DATA !== "true") {
    console.log("Skipping demo prospects (set SEED_DEMO_DATA=true to include them).");
    return;
  }

  const dealOwner = await prisma.user.findFirstOrThrow();

  for (const sample of SAMPLE_PROSPECTS) {
    const alreadyExists = await prisma.prospect.findFirst({ where: { name: sample.name } });
    if (alreadyExists) continue;

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

  const SAMPLE_ACTIVITIES = [
    { name: "Meridian Clinic Systems", type: "EMAIL", days: 30, responded: true },
    { name: "Meridian Clinic Systems", type: "CALL", days: 20, responded: true },
    { name: "Meridian Clinic Systems", type: "MEETING", days: 5, responded: true },
    { name: "CivicWorks Permitting", type: "EMAIL", days: 10, responded: false },
    { name: "DockSide Logistics Suite", type: "EMAIL", days: 60, responded: true },
    { name: "DockSide Logistics Suite", type: "CALL", days: 45, responded: true },
    { name: "ParishConnect", type: "EMAIL", days: 120, responded: true },
    { name: "ParishConnect", type: "MEETING", days: 90, responded: true },
  ] as const;

  const existingActivityCount = await prisma.sourcingActivity.count();
  if (existingActivityCount === 0) {
    for (const a of SAMPLE_ACTIVITIES) {
      const prospect = await prisma.prospect.findFirst({ where: { name: a.name } });
      if (!prospect) continue;
      const activityDate = new Date();
      activityDate.setDate(activityDate.getDate() - a.days);
      await prisma.sourcingActivity.create({
        data: {
          prospectId: prospect.id,
          activityType: a.type,
          activityDate,
          contactedById: dealOwner.id,
          resultedInResponse: a.responded,
        },
      });
    }
  }

  console.log(`Seeded ${SAMPLE_PROSPECTS.length} sample prospects (skipping any that already exist).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
