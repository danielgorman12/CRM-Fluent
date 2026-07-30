type Stage = { id: string; name: string; colorHex: string };

export function StageLegend({ stages }: { stages: Stage[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {stages.map((s) => (
        <span key={s.id} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.colorHex }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}
