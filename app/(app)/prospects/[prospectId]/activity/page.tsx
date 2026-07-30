import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createActivity } from "@/actions/activity-actions";
import { ActivityForm } from "@/components/prospects/ActivityForm";
import { ActivityTimeline } from "@/components/prospects/ActivityTimeline";

export default async function ActivityTab({
  params,
}: {
  params: Promise<{ prospectId: string }>;
}) {
  const { prospectId } = await params;
  const [session, users, activities] = await Promise.all([
    auth(),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.sourcingActivity.findMany({
      where: { prospectId },
      include: { contactedBy: true },
      orderBy: { activityDate: "desc" },
    }),
  ]);

  const action = createActivity.bind(null, prospectId);

  return (
    <div className="space-y-8">
      <ActivityForm action={action} users={users} defaultContactedById={session?.user?.id} />
      <ActivityTimeline activities={activities} />
    </div>
  );
}
