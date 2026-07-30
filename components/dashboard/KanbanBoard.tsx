"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { changeProspectStage } from "@/actions/stage-actions";
import type { BoardColumn } from "@/lib/dashboard-queries";

function formatArr(arr: number | null) {
  if (arr === null) return null;
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M ARR`;
  if (arr >= 1_000) return `$${Math.round(arr / 1_000)}k ARR`;
  return `$${arr} ARR`;
}

type Move = { prospectId: string; toStageId: string };

function applyMove(columns: BoardColumn[], move: Move): BoardColumn[] {
  const card = columns.flatMap((c) => c.cards).find((c) => c.id === move.prospectId);
  if (!card) return columns;

  return columns.map((column) => {
    if (column.stageId === move.toStageId) {
      if (column.cards.some((c) => c.id === card.id)) return column;
      return { ...column, cards: [card, ...column.cards] };
    }
    return { ...column, cards: column.cards.filter((c) => c.id !== card.id) };
  });
}

export function KanbanBoard({ columns }: { columns: BoardColumn[] }) {
  // useOptimistic keeps the card under the cursor after a drop, then reconciles
  // with the server result — without it the card visibly snaps back until the
  // page revalidates.
  const [optimisticColumns, addOptimisticMove] = useOptimistic(columns, applyMove);
  const [, startTransition] = useTransition();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleDrop(e: React.DragEvent, toStageId: string) {
    // Read the id from the drag payload rather than React state: state set in
    // dragstart isn't guaranteed to be committed by the time drop fires, and
    // dataTransfer is what carries drag data by design.
    const prospectId = e.dataTransfer.getData("text/plain") || draggedId;
    setDraggedId(null);
    setDragOverStageId(null);
    if (!prospectId) return;

    const from = optimisticColumns.find((c) => c.cards.some((card) => card.id === prospectId));
    if (!from || from.stageId === toStageId) return;

    setError(null);
    startTransition(async () => {
      addOptimisticMove({ prospectId, toStageId });
      try {
        await changeProspectStage(prospectId, toStageId, "Moved on the pipeline board");
      } catch {
        setError("Couldn't move that prospect. Please try again.");
      }
    });
  }

  const totalCards = optimisticColumns.reduce((sum, c) => sum + c.cards.length, 0);

  if (totalCards === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No prospects match these filters.{" "}
        <Link href="/prospects/new" className="underline underline-offset-2">
          Add a prospect
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Drag a card to another column to move that prospect through the pipeline.
      </p>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {optimisticColumns.map((column) => (
          <div
            key={column.stageId}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStageId(column.stageId);
            }}
            onDragLeave={() => setDragOverStageId((id) => (id === column.stageId ? null : id))}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(e, column.stageId);
            }}
            className={`flex w-56 shrink-0 flex-col rounded-lg border bg-muted/30 transition-colors ${
              dragOverStageId === column.stageId ? "border-foreground bg-muted" : ""
            }`}
          >
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: column.colorHex }}
              />
              <span className="truncate text-xs font-medium">{column.stageName}</span>
              <span className="ml-auto text-xs text-muted-foreground">{column.cards.length}</span>
            </div>

            <div className="flex min-h-24 flex-col gap-2 p-2">
              {column.cards.map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", card.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggedId(card.id);
                  }}
                  onDragEnd={() => {
                    setDraggedId(null);
                    setDragOverStageId(null);
                  }}
                  className={`cursor-grab rounded-md border bg-background p-2.5 shadow-sm active:cursor-grabbing ${
                    draggedId === card.id ? "opacity-40" : ""
                  }`}
                >
                  <Link
                    href={`/prospects/${card.id}`}
                    className="text-sm font-medium hover:underline"
                    draggable={false}
                  >
                    {card.name}
                  </Link>
                  <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {card.vertical && <p className="truncate">{card.vertical}</p>}
                    {card.location && <p className="truncate">{card.location}</p>}
                    {formatArr(card.arr) && (
                      <p className="font-medium text-foreground">{formatArr(card.arr)}</p>
                    )}
                    <p className="truncate">{card.dealOwner}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
