"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { draftCampaignFromSelection } from "@/actions/campaign-actions";
import { Button } from "@/components/ui/button";

export type SelectableProspect = {
  id: string;
  name: string;
  location: string | null;
  stageName: string;
  stageColor: string;
  arr: number | null;
};

export function GeoSelection({
  prospects,
  geographyNote,
}: {
  prospects: SelectableProspect[];
  geographyNote: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected = prospects.length > 0 && selected.size === prospects.length;

  return (
    <form action={draftCampaignFromSelection} className="flex min-h-0 flex-col">
      <input type="hidden" name="geographyNote" value={geographyNote} />

      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <button
          type="button"
          onClick={() => setSelected(allSelected ? new Set() : new Set(prospects.map((p) => p.id)))}
          className="text-xs font-medium underline underline-offset-2"
        >
          {allSelected ? "Clear all" : `Select all ${prospects.length}`}
        </button>
        <span className="text-xs text-muted-foreground">{selected.size} selected</span>
      </div>

      <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
        {prospects.map((p) => {
          const isSelected = selected.has(p.id);
          return (
            <li key={p.id}>
              {/* Whole row toggles, with a real checkbox carrying the value. */}
              <label className="flex cursor-pointer items-start gap-2.5 px-3 py-2.5 hover:bg-muted/40">
                <input
                  type="checkbox"
                  name="prospectId"
                  value={p.id}
                  checked={isSelected}
                  onChange={() => toggle(p.id)}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: p.stageColor }}
                    />
                    <span className="truncate text-sm font-medium">{p.name}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {[p.location, p.stageName].filter(Boolean).join(" · ")}
                    {p.arr !== null && ` · $${(p.arr / 1_000_000).toFixed(1)}M ARR`}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
        {prospects.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">
            No prospects in this geography.
          </li>
        )}
      </ul>

      <div className="space-y-2 border-t p-3">
        <Button type="submit" size="sm" className="w-full" disabled={selected.size === 0}>
          <Mail className="size-3.5" />
          Draft outreach to {selected.size || "…"}
        </Button>
        <Link
          href="/outreach"
          className="block text-center text-xs text-muted-foreground underline underline-offset-2"
        >
          View all campaigns
        </Link>
      </div>
    </form>
  );
}
