import Link from "next/link";
import { CircleCheck, RefreshCw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { isGranolaLive } from "@/lib/granola";
import { logNoteAsActivity, syncGranolaNotes } from "@/actions/note-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function NotesTab({
  params,
}: {
  params: Promise<{ prospectId: string }>;
}) {
  const { prospectId } = await params;

  const notes = await prisma.meetingNote.findMany({
    where: { prospectId },
    orderBy: { meetingDate: "desc" },
  });

  async function sync() {
    "use server";
    await syncGranolaNotes(prospectId);
  }

  const lastSynced = notes.reduce<Date | null>(
    (latest, n) => (latest === null || n.syncedAt > latest ? n.syncedAt : latest),
    null,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Granola meeting notes</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {isGranolaLive
              ? "Connected to Granola. Syncing pulls notes for meetings matched to this prospect."
              : "Demo mode — Granola isn't connected, so syncing generates representative notes. Set GRANOLA_API_KEY and GRANOLA_API_URL to pull real ones."}
            {lastSynced && ` Last synced ${lastSynced.toLocaleString()}.`}
          </p>
        </div>
        <form action={sync}>
          <Button type="submit" size="sm" variant={notes.length === 0 ? "default" : "outline"}>
            <RefreshCw className="size-3.5" />
            {notes.length === 0 ? "Sync from Granola" : "Re-sync"}
          </Button>
        </form>
      </div>

      {!isGranolaLive && (
        <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
          Notes below are generated for demonstration and are not real meeting records.
        </p>
      )}

      {notes.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm font-medium">No meeting notes yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sync to pull call notes into this prospect&apos;s file.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-48">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-medium">{note.title}</h3>
                    <Badge variant="secondary">{note.source === "GRANOLA" ? "Granola" : "Manual"}</Badge>
                    {note.loggedActivityId && (
                      <span className="inline-flex items-center gap-1 text-xs text-positive">
                        <CircleCheck className="size-3.5" />
                        In activity log
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {note.meetingDate.toLocaleString()}
                    {note.attendees ? ` · ${note.attendees}` : ""}
                  </p>
                </div>

                {note.loggedActivityId ? (
                  <Link
                    href={`/prospects/${prospectId}/activity`}
                    className="text-xs underline underline-offset-2"
                  >
                    View activity
                  </Link>
                ) : (
                  <form
                    action={async () => {
                      "use server";
                      await logNoteAsActivity(note.id);
                    }}
                  >
                    <Button type="submit" size="sm" variant="outline">
                      Log as meeting
                    </Button>
                  </form>
                )}
              </div>

              <p className="mt-3 whitespace-pre-line text-sm">{note.summary}</p>

              {note.actionItems && (
                <div className="mt-3 rounded-lg bg-muted/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Action items</p>
                  <p className="mt-1 whitespace-pre-line text-sm">{note.actionItems}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
