import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function SortHeader({
  columnKey,
  label,
  currentSort,
  currentDir,
  params,
  align = "right",
  hint,
}: {
  columnKey: string;
  label: string;
  currentSort: string;
  currentDir: "asc" | "desc";
  params: Record<string, string | undefined>;
  align?: "left" | "right";
  hint?: string;
}) {
  const active = currentSort === columnKey;
  // Clicking the active column flips direction; a new column starts descending,
  // since "highest first" is what you usually want when screening.
  const nextDir = active && currentDir === "desc" ? "asc" : "desc";

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  search.set("sort", columnKey);
  search.set("dir", nextDir);

  const Icon = active && currentDir === "asc" ? ArrowUp : ArrowDown;

  return (
    <Link
      href={`/prospects?${search.toString()}`}
      title={hint ? `${label} — ${hint}` : `Sort by ${label}`}
      className={cn(
        "group inline-flex items-center gap-1 whitespace-nowrap transition-colors hover:text-foreground",
        align === "right" && "flex-row-reverse",
        active ? "font-semibold text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
      <Icon
        className={cn("size-3 shrink-0", active ? "opacity-100" : "opacity-0 group-hover:opacity-40")}
      />
    </Link>
  );
}
