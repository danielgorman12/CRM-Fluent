"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProspectTabsNav({ prospectId }: { prospectId: string }) {
  const pathname = usePathname();
  const base = `/prospects/${prospectId}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/scorecard`, label: "Scorecard" },
    { href: `${base}/thesis`, label: "Thesis" },
    { href: `${base}/seller`, label: "Seller & Succession" },
    { href: `${base}/forecast`, label: "Forecast" },
    { href: `${base}/valuation`, label: "Valuation" },
    { href: `${base}/activity`, label: "Activity" },
  ];

  return (
    <nav className="flex gap-1 border-b">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "border-brand font-semibold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
