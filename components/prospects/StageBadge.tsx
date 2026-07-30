export function StageBadge({ name, colorHex }: { name: string; colorHex: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{ borderColor: colorHex, color: colorHex }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colorHex }} />
      {name}
    </span>
  );
}
