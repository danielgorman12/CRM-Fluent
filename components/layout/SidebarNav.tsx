"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Globe, Briefcase, Route } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/prospects", label: "Prospects", icon: Briefcase },
  { href: "/map", label: "Map", icon: Globe },
  { href: "/trips", label: "Trip planner", icon: Route },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-0.5">
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "font-semibold text-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
            )}
          >
            {/* Green rail marks the active section, as in the reference. */}
            {active && (
              <span className="absolute -left-4 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-brand" />
            )}
            <Icon className={cn("size-4 shrink-0", active && "text-brand")} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
