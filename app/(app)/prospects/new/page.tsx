import { prisma } from "@/lib/prisma";
import { createProspect } from "@/actions/prospect-actions";
import { ProspectForm } from "@/components/prospects/ProspectForm";

export default async function NewProspectPage() {
  const [verticals, stages, users] = await Promise.all([
    prisma.vertical.findMany({ orderBy: { name: "asc" } }),
    prisma.stageDefinition.findMany({ where: { category: "ACTIVE" }, orderBy: { order: "asc" } }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">New prospect</h1>
      <ProspectForm
        action={createProspect}
        verticals={verticals}
        stages={stages}
        users={users}
        submitLabel="Create prospect"
      />
    </div>
  );
}
