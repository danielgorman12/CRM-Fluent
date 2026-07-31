import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { seedDemoData } from "../lib/demo-mode";

// Bulk demo generator: tops the prospect list up to TARGET companies across the
// US, Canada, UK and Australia so the map and screening table have real volume.
//
// Deterministic (seeded RNG, no Math.random) so re-running produces the same
// companies, and inserts are batched with createMany rather than per-row nested
// creates. Run with:
//   npx tsx prisma/seed-bulk-demo.ts

const TARGET = 500;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260731);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
const between = (lo: number, hi: number) => lo + rnd() * (hi - lo);
const intBetween = (lo: number, hi: number) => Math.floor(between(lo, hi + 1));

const CITIES = [
  // country, city, region, lat, lon
  ["USA", "Austin", "TX", 30.2672, -97.7431],
  ["USA", "Denver", "CO", 39.7392, -104.9903],
  ["USA", "Nashville", "TN", 36.1627, -86.7816],
  ["USA", "Columbus", "OH", 39.9612, -82.9988],
  ["USA", "Charlotte", "NC", 35.2271, -80.8431],
  ["USA", "Kansas City", "MO", 39.0997, -94.5786],
  ["USA", "Phoenix", "AZ", 33.4484, -112.074],
  ["USA", "Minneapolis", "MN", 44.9778, -93.265],
  ["USA", "Tampa", "FL", 27.9506, -82.4572],
  ["USA", "Salt Lake City", "UT", 40.7608, -111.891],
  ["USA", "Pittsburgh", "PA", 40.4406, -79.9959],
  ["USA", "Indianapolis", "IN", 39.7684, -86.1581],
  ["USA", "Portland", "OR", 45.5152, -122.6784],
  ["USA", "Richmond", "VA", 37.5407, -77.436],
  ["USA", "Boise", "ID", 43.615, -116.2023],
  ["USA", "Omaha", "NE", 41.2565, -95.9345],
  ["USA", "Hartford", "CT", 41.7658, -72.6734],
  ["USA", "Savannah", "GA", 32.0809, -81.0912],
  ["USA", "Albuquerque", "NM", 35.0844, -106.6504],
  ["USA", "Milwaukee", "WI", 43.0389, -87.9065],
  ["Canada", "Toronto", "ON", 43.6532, -79.3832],
  ["Canada", "Montreal", "QC", 45.5019, -73.5674],
  ["Canada", "Calgary", "AB", 51.0447, -114.0719],
  ["Canada", "Vancouver", "BC", 49.2827, -123.1207],
  ["Canada", "Ottawa", "ON", 45.4215, -75.6972],
  ["Canada", "Winnipeg", "MB", 49.8951, -97.1384],
  ["Canada", "Halifax", "NS", 44.6488, -63.5752],
  ["Canada", "Quebec City", "QC", 46.8139, -71.208],
  ["Canada", "Edmonton", "AB", 53.5461, -113.4938],
  ["United Kingdom", "London", "England", 51.5074, -0.1278],
  ["United Kingdom", "Manchester", "England", 53.4808, -2.2426],
  ["United Kingdom", "Birmingham", "England", 52.4862, -1.8904],
  ["United Kingdom", "Leeds", "England", 53.8008, -1.5491],
  ["United Kingdom", "Bristol", "England", 51.4545, -2.5879],
  ["United Kingdom", "Edinburgh", "Scotland", 55.9533, -3.1883],
  ["United Kingdom", "Glasgow", "Scotland", 55.8642, -4.2518],
  ["United Kingdom", "Cardiff", "Wales", 51.4816, -3.1791],
  ["United Kingdom", "Belfast", "Northern Ireland", 54.5973, -5.9301],
  ["United Kingdom", "Reading", "England", 51.4543, -0.9781],
  ["United Kingdom", "Newcastle", "England", 54.9783, -1.6178],
  ["Australia", "Sydney", "NSW", -33.8688, 151.2093],
  ["Australia", "Melbourne", "VIC", -37.8136, 144.9631],
  ["Australia", "Brisbane", "QLD", -27.4698, 153.0251],
  ["Australia", "Perth", "WA", -31.9505, 115.8605],
  ["Australia", "Adelaide", "SA", -34.9285, 138.6007],
  ["Australia", "Canberra", "ACT", -35.2809, 149.13],
  ["Australia", "Hobart", "TAS", -42.8821, 147.3272],
  ["Australia", "Newcastle", "NSW", -32.9283, 151.7817],
  ["Australia", "Gold Coast", "QLD", -28.0167, 153.4],
] as const;

const PREFIX = [
  "Meridian", "Ridgeline", "Beacon", "Northwind", "Summit", "Harbour", "Cedar", "Ironwood",
  "Clearwater", "Lakeshore", "Granite", "Pinnacle", "Westfield", "Copperline", "Silverbirch",
  "Falcon", "Bluestone", "Redcliff", "Elmwood", "Highgate", "Kestrel", "Thornbury", "Aldergrove",
  "Fairhaven", "Stonebridge", "Wexford", "Marlow", "Ashfield", "Brackenhill", "Colvin",
  "Drayton", "Eastvale", "Fernbank", "Glenmore", "Hollowell", "Inverleith", "Jarrow", "Kingsmere",
  "Langford", "Merrivale", "Norbury", "Oakhurst", "Penrose", "Quarrybrook", "Rosslare",
  "Sandhurst", "Tarnwell", "Uplands", "Verity", "Wynyard",
] as const;

const CORE = [
  "Clinic", "Ledger", "Dispatch", "Docket", "Campus", "Freight", "Parish", "Permit", "Tenancy",
  "Roster", "Fleet", "Practice", "Council", "Chapter", "Yard", "Scholar", "Estate", "Caseload",
  "Member", "Depot", "Registry", "Rota", "Trades", "Payroll", "Archive", "Cargo", "Steward",
  "Custody", "Curriculum", "Warranty",
] as const;

const SUFFIX_BY_COUNTRY: Record<string, readonly string[]> = {
  USA: ["Systems", "Software", "Solutions", "Technologies", "Suite", "Works", "Labs", "Group"],
  Canada: ["Systems", "Software", "Solutions", "Technologies", "Group", "Logic", "Data"],
  "United Kingdom": ["Systems Ltd", "Software Ltd", "Solutions Ltd", "Technologies Ltd", "Group Ltd", "Digital Ltd"],
  Australia: ["Systems Pty", "Software Pty", "Solutions Pty", "Technologies Pty", "Group Pty", "Works Pty"],
};

const FIRST = [
  "Alan", "Marcia", "Ray", "Gail", "Curtis", "Devon", "Harriet", "Yvette", "Luc", "Sandeep",
  "Nigel", "Fiona", "Iain", "Peter", "Bruce", "Alice", "Dermot", "Joan", "Priya", "Callum",
  "Rosa", "Trevor", "Nadia", "Errol", "Bianca", "Hugh", "Simone", "Omar", "Greta", "Lachlan",
] as const;
const LAST = [
  "Reeves", "Holt", "Ellison", "Prentice", "Vance", "Marsh", "Lowe", "Tremblay", "Bergeron",
  "Rai", "Ashworth", "Blackwell", "McAllister", "Grayling", "Hollands", "Nguyen", "Walsh",
  "Petrakis", "Okafor", "Sandoval", "Whitfield", "Lindqvist", "Barlow", "Kowalski", "Duarte",
  "Fenwick", "Ibrahim", "Novak", "Rutherford", "Sinclair",
] as const;

// Weighted so the pipeline looks like a real funnel rather than uniform.
const STAGE_WEIGHTS: Array<[string, number]> = [
  ["Identified", 34],
  ["Outreach Sent", 22],
  ["Seller Responded", 12],
  ["Initial Discussions", 10],
  ["Advanced Discussions", 7],
  ["Pre-LOI", 4],
  ["LOI Submitted", 3],
  ["LOI Accepted", 2],
  ["Closed Won", 3],
  ["Closed Lost", 3],
];
const STAGE_POOL = STAGE_WEIGHTS.flatMap(([name, w]) => Array<string>(w).fill(name));

const TIMELINES = ["UNDER_1YR", "ONE_TO_3YR", "THREE_TO_5YR", "FIVE_PLUS_YR", "UNKNOWN"] as const;
const SUCCESSORS = ["NONE", "FAMILY", "INTERNAL", "UNKNOWN"] as const;

async function main() {
  // Same gate as the other demo seed: never populate a database that's behind
  // real SSO with 500 fictional companies.
  if (!seedDemoData) {
    console.log("Skipping bulk demo prospects (real SSO is configured).");
    return;
  }

  const existing = await prisma.prospect.findMany({ select: { name: true } });
  const used = new Set(existing.map((p) => p.name));
  const needed = TARGET - existing.length;

  if (needed <= 0) {
    console.log(`Already ${existing.length} prospects — nothing to add.`);
    return;
  }

  // Spread ownership over a few team members so the owner filter is useful.
  const OWNERS = [
    { email: "daniel.gorman@fluentcorp.com", name: "Daniel Gorman", title: "Portfolio Controller" },
    { email: "ma.analyst1@fluentcorp.com", name: "Priya Raman", title: "M&A Analyst" },
    { email: "ma.analyst2@fluentcorp.com", name: "Tom Beckett", title: "M&A Associate" },
    { email: "ma.lead@fluentcorp.com", name: "Sofia Marchetti", title: "Head of M&A" },
  ];
  for (const o of OWNERS) {
    await prisma.user.upsert({ where: { email: o.email }, update: o, create: o });
  }

  const [users, stages, verticals] = await Promise.all([
    prisma.user.findMany({ where: { isActive: true } }),
    prisma.stageDefinition.findMany(),
    prisma.vertical.findMany(),
  ]);
  const stageByName = new Map(stages.map((s) => [s.name, s]));

  type Row = {
    name: string;
    description: string;
    verticalId: string;
    city: string;
    region: string;
    country: string;
    latitude: number;
    longitude: number;
    geocodeStatus: "MANUAL";
    geocodeSource: string;
    geocodedAt: Date;
    currentARR: number;
    currentEBITDA: number;
    currentEBITDAMargin: number;
    grossRetentionPct: number;
    netRetentionPct: number;
    currentStageId: string;
    dealOwnerId: string;
    createdById: string;
  };

  const rows: Row[] = [];
  const extras: Array<{
    name: string;
    scores: number[];
    overall: number;
    forecast: { growth: number; arr: number; ebitda: number; margin: number; upside: number };
    val: { low: number; high: number; revLow: number; revHigh: number; ebLow: number; ebHigh: number; price: number; roce: number };
    owner: { name: string; age: number; years: number; timeline: string; successor: string };
    stageName: string;
    activities: number;
  }> = [];

  let guard = 0;
  while (rows.length < needed && guard < needed * 40) {
    guard += 1;
    const [country, city, region, lat, lon] = pick(CITIES);
    const suffix = pick(SUFFIX_BY_COUNTRY[country]);
    const name = `${pick(PREFIX)} ${pick(CORE)} ${suffix}`;
    if (used.has(name)) continue;
    used.add(name);

    const vertical = pick(verticals);
    const stageName = pick(STAGE_POOL);
    const stage = stageByName.get(stageName);
    if (!stage) continue;
    const owner = pick(users);

    const arr = Math.round(between(700_000, 9_500_000) / 50_000) * 50_000;
    const margin = Math.round(between(10, 40));
    const ebitda = Math.round((arr * margin) / 100);
    const grossRetention = Math.round(between(82, 98));
    const netRetention = grossRetention + Math.round(between(-4, 14));

    // Jitter coordinates slightly so same-city companies don't stack exactly.
    const latitude = lat + between(-0.35, 0.35);
    const longitude = lon + between(-0.35, 0.35);

    rows.push({
      name,
      description: `${vertical.name} software for ${city}-area operators.`,
      verticalId: vertical.id,
      city,
      region,
      country,
      latitude,
      longitude,
      geocodeStatus: "MANUAL",
      geocodeSource: "generated",
      geocodedAt: new Date(),
      currentARR: arr,
      currentEBITDA: ebitda,
      currentEBITDAMargin: margin,
      grossRetentionPct: grossRetention,
      netRetentionPct: netRetention,
      currentStageId: stage.id,
      dealOwnerId: owner.id,
      createdById: owner.id,
    });

    const scores = Array.from({ length: 8 }, () => intBetween(3, 10));
    const overall = Math.round((scores.reduce((a, b) => a + b, 0) / 8) * 10) / 10;
    const growth = Math.round(between(2, 22));
    const fMargin = Math.min(48, margin + intBetween(1, 8));
    const revMid = between(2.1, 4.2);
    const ebMid = between(7.5, 16);

    extras.push({
      name,
      scores,
      overall,
      forecast: {
        growth,
        arr: Math.round((arr * (1 + growth / 100)) / 10_000) * 10_000,
        ebitda: Math.round((arr * (1 + growth / 100) * fMargin) / 100),
        margin: fMargin,
        upside: fMargin - margin,
      },
      val: {
        low: Math.round((arr * revMid * 0.9) / 100_000) * 100_000,
        high: Math.round((arr * revMid * 1.12) / 100_000) * 100_000,
        revLow: Math.round(revMid * 0.9 * 10) / 10,
        revHigh: Math.round(revMid * 1.12 * 10) / 10,
        ebLow: Math.round(ebMid * 0.9 * 10) / 10,
        ebHigh: Math.round(ebMid * 1.12 * 10) / 10,
        price: Math.round((arr * revMid) / 100_000) * 100_000,
        roce: Math.round(between(6, 22)),
      },
      owner: {
        name: `${pick(FIRST)} ${pick(LAST)}`,
        age: intBetween(42, 70),
        years: intBetween(6, 30),
        timeline: pick(TIMELINES),
        successor: pick(SUCCESSORS),
      },
      stageName,
      activities: ["Identified"].includes(stageName) ? 0 : intBetween(1, 4),
    });
  }

  await prisma.prospect.createMany({ data: rows, skipDuplicates: true });

  const created = await prisma.prospect.findMany({
    where: { name: { in: rows.map((r) => r.name) } },
    select: { id: true, name: true, dealOwnerId: true, currentStageId: true },
  });
  const idByName = new Map(created.map((c) => [c.name, c]));

  const history: Array<{ prospectId: string; stageId: string; changedById: string }> = [];
  const scorecards: Record<string, unknown>[] = [];
  const forecasts: Record<string, unknown>[] = [];
  const valuations: Record<string, unknown>[] = [];
  const sellers: Record<string, unknown>[] = [];
  const activities: Record<string, unknown>[] = [];

  const ACT_TYPES = ["EMAIL", "CALL", "MEETING"] as const;

  for (const e of extras) {
    const p = idByName.get(e.name);
    if (!p) continue;

    history.push({ prospectId: p.id, stageId: p.currentStageId, changedById: p.dealOwnerId });
    scorecards.push({
      prospectId: p.id,
      financialAttractivenessScore: e.scores[0],
      customerRetentionScore: e.scores[1],
      recurringRevenueQualityScore: e.scores[2],
      strategicFitScore: e.scores[3],
      verticalAttractivenessScore: e.scores[4],
      sellerWillingnessScore: e.scores[5],
      keyRisksScore: e.scores[6],
      valuationReturnsScore: e.scores[7],
      overallScore: e.overall,
      scoredById: p.dealOwnerId,
    });
    forecasts.push({
      prospectId: p.id,
      forecastedRevenueGrowthPct: e.forecast.growth,
      forecastedARR: e.forecast.arr,
      forecastedEBITDA: e.forecast.ebitda,
      forecastedEBITDAMargin: e.forecast.margin,
      marginImprovementPts: e.forecast.upside,
      horizonYears: 3,
      createdById: p.dealOwnerId,
    });
    valuations.push({
      prospectId: p.id,
      indicativePriceRangeLow: e.val.low,
      indicativePriceRangeHigh: e.val.high,
      revenueMultipleLow: e.val.revLow,
      revenueMultipleHigh: e.val.revHigh,
      ebitdaMultipleLow: e.val.ebLow,
      ebitdaMultipleHigh: e.val.ebHigh,
      forecastedPurchasePrice: e.val.price,
      expectedROCE: e.val.roce,
      updatedById: p.dealOwnerId,
    });
    sellers.push({
      prospectId: p.id,
      ownerName: e.owner.name,
      ownerAge: e.owner.age,
      yearsOwned: e.owner.years,
      expectedSuccessionTimeline: e.owner.timeline,
      successorIdentified: e.owner.successor,
      lastReviewedById: p.dealOwnerId,
      lastReviewedAt: new Date(),
    });

    for (let i = 0; i < e.activities; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() - intBetween(3, 300));
      activities.push({
        prospectId: p.id,
        activityType: ACT_TYPES[Math.min(i, ACT_TYPES.length - 1)],
        activityDate: d,
        contactedById: p.dealOwnerId,
        contactPersonName: e.owner.name,
        resultedInResponse: rnd() > 0.42,
      });
    }
  }

  await Promise.all([
    prisma.prospectStageHistory.createMany({ data: history as never }),
    prisma.scorecard.createMany({ data: scorecards as never, skipDuplicates: true }),
    prisma.prospectForecast.createMany({ data: forecasts as never, skipDuplicates: true }),
    prisma.valuationAnalysis.createMany({ data: valuations as never, skipDuplicates: true }),
    prisma.sellerRelationship.createMany({ data: sellers as never, skipDuplicates: true }),
  ]);
  await prisma.sourcingActivity.createMany({ data: activities as never });

  const total = await prisma.prospect.count();
  console.log(`Added ${created.length} prospects (${activities.length} activities). Total now ${total}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
