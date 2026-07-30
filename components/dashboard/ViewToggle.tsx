import Link from "next/link";
import { Button } from "@/components/ui/button";

const VIEWS = [
  { value: "funnel", label: "Funnel" },
  { value: "board", label: "Board" },
] as const;

export function ViewToggle({
  current,
  params,
}: {
  current: string;
  params: Record<string, string | undefined>;
}) {
  function hrefFor(view: string) {
    // Carry the active filters across so switching view doesn't reset them.
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    search.set("view", view);
    return `/dashboard?${search.toString()}`;
  }

  return (
    <div className="flex gap-2">
      {VIEWS.map((view) => (
        <Button
          key={view.value}
          size="sm"
          variant={current === view.value ? "default" : "outline"}
          render={<Link href={hrefFor(view.value)}>{view.label}</Link>}
        />
      ))}
    </div>
  );
}
