import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProspect } from "@/actions/prospect-actions";
import { ProspectForm } from "@/components/prospects/ProspectForm";

export default async function EditProspectPage({
  params,
}: {
  params: Promise<{ prospectId: string }>;
}) {
  const { prospectId } = await params;

  const [prospect, verticals, stages, users] = await Promise.all([
    prisma.prospect.findUnique({ where: { id: prospectId } }),
    prisma.vertical.findMany({ orderBy: { name: "asc" } }),
    prisma.stageDefinition.findMany({ where: { category: "ACTIVE" }, orderBy: { order: "asc" } }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  if (!prospect) notFound();

  const updateWithId = updateProspect.bind(null, prospectId);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Edit prospect</h1>
      <ProspectForm
        action={updateWithId}
        verticals={verticals}
        stages={stages}
        users={users}
        defaultValues={{
          ...prospect,
          currentARR: prospect.currentARR?.toString(),
          currentEBITDA: prospect.currentEBITDA?.toString(),
          currentEBITDAMargin: prospect.currentEBITDAMargin?.toString(),
          grossRetentionPct: prospect.grossRetentionPct?.toString(),
          netRetentionPct: prospect.netRetentionPct?.toString(),
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
