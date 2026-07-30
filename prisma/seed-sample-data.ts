import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { seedDemoData } from "../lib/demo-mode";

// Fictional prospects for demo deployments, so the map, dashboard funnel, and
// prospect list have something to show.
//
// Gated on `seedDemoData` (see lib/demo-mode.ts): follows demo mode, which is
// on until real SSO credentials are configured. So fake companies can't land in
// a database that's behind real authentication. Run manually with:
//   npx tsx prisma/seed-sample-data.ts
// Requires prisma/seed.ts to have already run (stages/verticals/team members).

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Scorecard, forecast and valuation figures per demo prospect, so the screening
// table has something to sort on across every metric group. Deliberately varied
// — each company leads on a different metric, which makes re-sorting visibly
// change the ranking.
const SAMPLE_ANALYSIS: Record<
  string,
  {
    scores: [number, number, number, number, number, number, number, number];
    forecast: { growth: number; arr: number; ebitda: number; margin: number; upside: number };
    valuation: {
      low: number;
      high: number;
      revLow: number;
      revHigh: number;
      ebLow: number;
      ebHigh: number;
      price: number;
      roce: number;
    };
  }
> = {
  "Meridian Clinic Systems": {
    scores: [8, 9, 8, 7, 8, 5, 6, 7],
    forecast: { growth: 12, arr: 5_200_000, ebitda: 1_600_000, margin: 31, upside: 5 },
    valuation: { low: 12_000_000, high: 15_000_000, revLow: 2.9, revHigh: 3.6, ebLow: 10.9, ebHigh: 13.6, price: 13_500_000, roce: 13 },
  },
  "CivicWorks Permitting": {
    scores: [6, 9, 9, 6, 9, 4, 7, 6],
    forecast: { growth: 8, arr: 2_100_000, ebitda: 550_000, margin: 26, upside: 7 },
    valuation: { low: 4_500_000, high: 5_500_000, revLow: 2.5, revHigh: 3.1, ebLow: 12.9, ebHigh: 15.7, price: 5_000_000, roce: 11 },
  },
  "DockSide Logistics Suite": {
    scores: [9, 7, 7, 8, 7, 8, 5, 8],
    forecast: { growth: 15, arr: 7_500_000, ebitda: 2_700_000, margin: 36, upside: 3 },
    valuation: { low: 18_000_000, high: 22_000_000, revLow: 3.0, revHigh: 3.6, ebLow: 9.0, ebHigh: 11.0, price: 20_000_000, roce: 18 },
  },
  ParishConnect: {
    scores: [7, 10, 9, 7, 6, 9, 8, 7],
    forecast: { growth: 6, arr: 3_200_000, ebitda: 1_120_000, margin: 35, upside: 2 },
    valuation: { low: 9_000_000, high: 11_000_000, revLow: 3.1, revHigh: 3.8, ebLow: 9.5, ebHigh: 11.6, price: 10_000_000, roce: 16 },
  },
};

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
  if (!seedDemoData) {
    console.log("Skipping demo prospects (real SSO is configured; set SEED_DEMO_DATA=true to force).");
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

    const analysis = SAMPLE_ANALYSIS[sample.name];
    const [fin, ret, rec, fit, vert, seller, risk, returns] = analysis.scores;
    const overall = Math.round((analysis.scores.reduce((a, b) => a + b, 0) / 8) * 10) / 10;

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
        scorecard: {
          create: {
            financialAttractivenessScore: fin,
            customerRetentionScore: ret,
            recurringRevenueQualityScore: rec,
            strategicFitScore: fit,
            verticalAttractivenessScore: vert,
            sellerWillingnessScore: seller,
            keyRisksScore: risk,
            valuationReturnsScore: returns,
            overallScore: overall,
            scoredById: dealOwner.id,
          },
        },
        forecast: {
          create: {
            forecastedRevenueGrowthPct: analysis.forecast.growth,
            forecastedARR: analysis.forecast.arr,
            forecastedEBITDA: analysis.forecast.ebitda,
            forecastedEBITDAMargin: analysis.forecast.margin,
            marginImprovementPts: analysis.forecast.upside,
            horizonYears: 3,
            createdById: dealOwner.id,
          },
        },
        valuation: {
          create: {
            indicativePriceRangeLow: analysis.valuation.low,
            indicativePriceRangeHigh: analysis.valuation.high,
            revenueMultipleLow: analysis.valuation.revLow,
            revenueMultipleHigh: analysis.valuation.revHigh,
            ebitdaMultipleLow: analysis.valuation.ebLow,
            ebitdaMultipleHigh: analysis.valuation.ebHigh,
            forecastedPurchasePrice: analysis.valuation.price,
            expectedROCE: analysis.valuation.roce,
            updatedById: dealOwner.id,
          },
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
