import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { loadScreenRows, parseScreenFilters, SCREEN_COLUMNS, sortRows } from "@/lib/screening";

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Mirror the screening view's filters and sort so the export matches what was
  // on screen. Always exports every metric column, not just the visible group —
  // a spreadsheet has no width limit.
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const filters = parseScreenFilters(params);
  const sort = params.sort ?? "arr";
  const dir = params.dir === "asc" ? "asc" : "desc";

  const rows = sortRows(await loadScreenRows(filters), sort, dir);

  const header = [
    "Company",
    "Stage",
    "Vertical",
    "Location",
    "Deal Owner",
    ...SCREEN_COLUMNS.map((c) => c.label),
  ];

  const body = rows.map((row) => [
    row.name,
    row.stageName,
    row.vertical ?? "",
    row.location ?? "",
    row.dealOwner,
    // Raw numbers rather than formatted strings, so the file stays analysable.
    ...SCREEN_COLUMNS.map((c) => {
      const value = row.metrics[c.key];
      return value === null || value === undefined ? "" : String(value);
    }),
  ]);

  const csv = [header, ...body].map((line) => line.map(escapeCsvCell).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prospect-screen-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
