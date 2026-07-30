import { Badge } from "@/components/ui/badge";

type Activity = {
  id: string;
  activityType: string;
  activityDate: Date;
  contactPersonName: string | null;
  resultedInResponse: boolean;
  outcomeNotes: string | null;
  followUpRequired: boolean;
  followUpDate: Date | null;
  followUpNotes: string | null;
  contactedBy: { name: string };
};

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity logged yet.</p>;
  }

  return (
    <ul className="max-w-2xl space-y-3">
      {activities.map((a) => (
        <li key={a.id} className="rounded-lg border p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{a.activityType}</Badge>
            <span className="text-muted-foreground">{a.activityDate.toLocaleDateString()}</span>
            <span className="text-muted-foreground">·</span>
            <span>{a.contactedBy.name}</span>
            {a.contactPersonName && (
              <>
                <span className="text-muted-foreground">→</span>
                <span>{a.contactPersonName}</span>
              </>
            )}
            {a.resultedInResponse && <Badge>Responded</Badge>}
            {a.followUpRequired && <Badge variant="outline">Follow-up needed</Badge>}
          </div>
          {a.outcomeNotes && <p className="mt-1.5 text-muted-foreground">{a.outcomeNotes}</p>}
          {a.followUpRequired && (a.followUpDate || a.followUpNotes) && (
            <p className="mt-1 text-xs text-muted-foreground">
              Follow up{a.followUpDate ? ` by ${a.followUpDate.toLocaleDateString()}` : ""}
              {a.followUpNotes ? `: ${a.followUpNotes}` : ""}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
