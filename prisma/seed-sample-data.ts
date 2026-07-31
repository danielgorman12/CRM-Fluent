import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { seedDemoData } from "../lib/demo-mode";
import { DEMO_COMPANIES } from "./demo-companies";

// Fictional prospects for demo deployments, so the map, screening table and
// dashboard have something to show.
//
// Gated on `seedDemoData` (see lib/demo-mode.ts): follows demo mode, which is
// on until real SSO credentials are configured. So fake companies can't land in
// a database that's behind real authentication. Run manually with:
//   npx tsx prisma/seed-sample-data.ts
// Requires prisma/seed.ts to have already run (stages/verticals/team members).

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Outreach history, keyed by company, so the funnel and response rates aren't
// flat. Days are relative to now, so the demo never looks stale.
const ACTIVITY_PATTERN: Record<string, Array<{ type: "EMAIL" | "CALL" | "MEETING"; days: number; responded: boolean }>> = {
  "Meridian Clinic Systems": [
    { type: "EMAIL", days: 96, responded: true },
    { type: "CALL", days: 74, responded: true },
    { type: "MEETING", days: 20, responded: true },
  ],
  "CivicWorks Permitting": [{ type: "EMAIL", days: 12, responded: false }],
  "DockSide Logistics Suite": [
    { type: "EMAIL", days: 140, responded: true },
    { type: "CALL", days: 118, responded: true },
    { type: "MEETING", days: 45, responded: true },
  ],
  ParishConnect: [
    { type: "EMAIL", days: 210, responded: true },
    { type: "MEETING", days: 170, responded: true },
  ],
  "Ridgeline Field Ops": [
    { type: "EMAIL", days: 88, responded: true },
    { type: "CALL", days: 40, responded: true },
  ],
  "Beacon Campus Suite": [
    { type: "EMAIL", days: 30, responded: true },
    { type: "CALL", days: 9, responded: true },
  ],
  "Maple Ridge Property Systems": [
    { type: "EMAIL", days: 62, responded: true },
    { type: "CALL", days: 28, responded: true },
  ],
  "Nordiq Fleet Logic": [
    { type: "EMAIL", days: 130, responded: true },
    { type: "MEETING", days: 33, responded: true },
  ],
  "Prairie Health Records": [{ type: "EMAIL", days: 18, responded: false }],
  "Thameside Council Systems": [
    { type: "EMAIL", days: 70, responded: true },
    { type: "CALL", days: 24, responded: true },
  ],
  "Chancery Docket Ltd": [
    { type: "EMAIL", days: 155, responded: true },
    { type: "CALL", days: 120, responded: true },
    { type: "MEETING", days: 52, responded: true },
  ],
  "Harbour Estates Software": [
    { type: "EMAIL", days: 240, responded: true },
    { type: "CALL", days: 205, responded: false },
  ],
  "Southern Cross Trades": [
    { type: "EMAIL", days: 110, responded: true },
    { type: "MEETING", days: 26, responded: true },
  ],
  "Billabong Learning Systems": [{ type: "EMAIL", days: 21, responded: false }],
  "Coral Coast Freight": [
    { type: "EMAIL", days: 99, responded: true },
    { type: "CALL", days: 36, responded: true },
  ],
  "Kakadu Member Hub": [
    { type: "EMAIL", days: 260, responded: true },
    { type: "MEETING", days: 215, responded: true },
  ],
};

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function main() {
  if (!seedDemoData) {
    console.log("Skipping demo prospects (real SSO is configured; set SEED_DEMO_DATA=true to force).");
    return;
  }

  const dealOwner = await prisma.user.findFirstOrThrow();
  let created = 0;

  for (const company of DEMO_COMPANIES) {
    if (await prisma.prospect.findFirst({ where: { name: company.name } })) continue;

    const [vertical, stage] = await Promise.all([
      prisma.vertical.findUniqueOrThrow({ where: { name: company.vertical } }),
      prisma.stageDefinition.findUniqueOrThrow({ where: { name: company.stage } }),
    ]);

    const [fin, ret, rec, fit, vert, seller, risk, returns] = company.scores;
    const overall = Math.round((company.scores.reduce((a, b) => a + b, 0) / 8) * 10) / 10;
    const v = company.valuation;

    const prospect = await prisma.prospect.create({
      data: {
        name: company.name,
        description: company.description,
        verticalId: vertical.id,
        city: company.city,
        region: company.region,
        country: company.country,
        latitude: company.lat,
        longitude: company.lon,
        geocodeStatus: "MANUAL",
        geocodeSource: "manual",
        geocodedAt: new Date(),
        currentARR: company.arr,
        currentEBITDA: company.ebitda,
        currentEBITDAMargin: company.margin,
        grossRetentionPct: company.grossRetention,
        netRetentionPct: company.netRetention,
        currentStageId: stage.id,
        dealOwnerId: dealOwner.id,
        createdById: dealOwner.id,
        stageHistory: { create: { stageId: stage.id, changedById: dealOwner.id } },
        sellerRelationship: {
          create: {
            ownerName: company.owner.name,
            ownerAge: company.owner.age,
            yearsOwned: company.owner.yearsOwned,
            expectedSuccessionTimeline: company.owner.timeline as never,
            successorIdentified: company.owner.successor as never,
            lastReviewedById: dealOwner.id,
            lastReviewedAt: new Date(),
          },
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
            forecastedRevenueGrowthPct: company.forecast.growth,
            forecastedARR: company.forecast.arr,
            forecastedEBITDA: company.forecast.ebitda,
            forecastedEBITDAMargin: company.forecast.margin,
            marginImprovementPts: company.forecast.upside,
            horizonYears: 3,
            createdById: dealOwner.id,
          },
        },
        valuation: {
          create: {
            indicativePriceRangeLow: v.low,
            indicativePriceRangeHigh: v.high,
            revenueMultipleLow: v.revLow,
            revenueMultipleHigh: v.revHigh,
            ebitdaMultipleLow: v.ebLow,
            ebitdaMultipleHigh: v.ebHigh,
            forecastedPurchasePrice: v.price,
            expectedROCE: v.roce,
            updatedById: dealOwner.id,
          },
        },
      },
    });

    for (const a of ACTIVITY_PATTERN[company.name] ?? []) {
      await prisma.sourcingActivity.create({
        data: {
          prospectId: prospect.id,
          activityType: a.type,
          activityDate: daysAgo(a.days),
          contactedById: dealOwner.id,
          contactPersonName: company.owner.name,
          resultedInResponse: a.responded,
        },
      });
    }

    created += 1;
  }

  console.log(
    `Demo data: ${created} new prospects created (${DEMO_COMPANIES.length - created} already existed).`,
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
