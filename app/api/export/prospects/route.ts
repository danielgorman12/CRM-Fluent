import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const COLUMNS = [
  "Name",
  "Vertical",
  "City",
  "Region",
  "Country",
  "Stage",
  "Deal Owner",
  "Current ARR",
  "Current EBITDA",
  "EBITDA Margin",
  "Indicative Price Low",
  "Indicative Price High",
] as const;

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const prospects = await prisma.prospect.findMany({
    include: { vertical: true, currentStage: true, dealOwner: true, valuation: true },
    orderBy: { name: "asc" },
  });

  const rows = prospects.map((p) => [
    p.name,
    p.vertical?.name ?? "",
    p.city ?? "",
    p.region ?? "",
    p.country ?? "",
    p.currentStage.name,
    p.dealOwner.name,
    p.currentARR?.toString() ?? "",
    p.currentEBITDA?.toString() ?? "",
    p.currentEBITDAMargin?.toString() ?? "",
    p.valuation?.indicativePriceRangeLow?.toString() ?? "",
    p.valuation?.indicativePriceRangeHigh?.toString() ?? "",
  ]);

  const csv = [COLUMNS, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prospects-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
