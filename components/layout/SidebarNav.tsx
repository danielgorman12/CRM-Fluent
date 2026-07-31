"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Globe, Briefcase, Route, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/prospects", label: "Prospects", icon: Briefcase },
  { href: "/map", label: "Map", icon: Globe },
  { href: "/outreach", label: "Outreach", icon: Mail },
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
                ? "bg-sidebar-accent font-medium text-cream"
                : "text-cream/65 hover:bg-sidebar-accent/60 hover:text-cream",
            )}
          >
            {/* Light-blue rail marks the active section against the navy. */}
            {active && (
              <span className="absolute -left-4 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-brand-soft" />
            )}
            <Icon className={cn("size-4 shrink-0", active && "text-brand-soft")} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
