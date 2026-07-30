type Stage = { id: string; name: string; order: number; category: string; colorHex: string };

export function PipelineProgress({
  stages,
  currentStageId,
}: {
  stages: Stage[];
  currentStageId: string;
}) {
  const current = stages.find((s) => s.id === currentStageId);
  const activeStages = stages.filter((s) => s.category === "ACTIVE").sort((a, b) => a.order - b.order);

  if (current && current.category !== "ACTIVE") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: current.colorHex }}
        />
        <span className="font-medium" style={{ color: current.colorHex }}>
          {current.name}
        </span>
        <span className="text-muted-foreground">— pipeline closed</span>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center">
      {activeStages.map((stage, i) => {
        const reached = current ? stage.order <= current.order : false;
        const isCurrent = stage.id === currentStageId;
        return (
          <div key={stage.id} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className="h-3 w-3 rounded-full border-2"
                style={{
                  borderColor: stage.colorHex,
                  backgroundColor: reached ? stage.colorHex : "transparent",
                }}
                title={stage.name}
              />
              <span
                className={`max-w-16 text-center text-[10px] leading-tight ${isCurrent ? "font-semibold" : "text-muted-foreground"}`}
              >
                {stage.name}
              </span>
            </div>
            {i < activeStages.length - 1 && (
              <div
                className="mx-1 h-0.5 flex-1"
                style={{ backgroundColor: reached ? stage.colorHex : "var(--border)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
