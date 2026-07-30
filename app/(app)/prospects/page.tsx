import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StageBadge } from "@/components/prospects/StageBadge";

export default async function ProspectsPage() {
  const prospects = await prisma.prospect.findMany({
    include: { currentStage: true, vertical: true, dealOwner: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prospects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {prospects.length} acquisition {prospects.length === 1 ? "target" : "targets"} tracked.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<a href="/api/export/prospects">Export CSV</a>} />
          <Button render={<Link href="/prospects/new">New prospect</Link>} />
        </div>
      </div>

      {prospects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No prospects yet.{" "}
          <Link href="/prospects/new" className="underline underline-offset-2">
            Add the first one
          </Link>
          .
        </p>
      ) : (
        <Table className="overflow-hidden rounded-xl border">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Vertical</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Deal owner</TableHead>
              <TableHead className="text-right">ARR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prospects.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link href={`/prospects/${p.id}`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell>{p.vertical?.name ?? "—"}</TableCell>
                <TableCell>{[p.city, p.region, p.country].filter(Boolean).join(", ") || "—"}</TableCell>
                <TableCell>
                  <StageBadge name={p.currentStage.name} colorHex={p.currentStage.colorHex} />
                </TableCell>
                <TableCell>{p.dealOwner.name}</TableCell>
                <TableCell className="text-right">
                  {p.currentARR ? `$${Number(p.currentARR).toLocaleString()}` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
