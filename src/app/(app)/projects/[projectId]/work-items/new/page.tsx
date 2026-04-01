import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { WorkItemForm } from "@/components/work-items/WorkItemForm"

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default async function NewWorkItemPage({ params }: PageProps) {
  const { projectId } = await params

  const [project, statuses, teamMembers, versions] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.workspaceStatus.findMany({
      where: { isArchived: false },
      orderBy: { order: "asc" },
    }),
    prisma.teamMember.findMany({
      where: { projectId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.version.findMany({
      where: { projectId, isArchived: false },
      orderBy: { createdAt: "asc" },
    }),
  ])

  if (!project) notFound()

  const defaultStatus = statuses.find((s) => s.isDefault) ?? statuses[0]

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <p className="text-sm text-muted-foreground">{project.name}</p>
        <h1 className="text-2xl font-semibold">New Work Item</h1>
      </div>
      <WorkItemForm
        projectId={projectId}
        statuses={statuses}
        teamMembers={teamMembers}
        versions={versions}
        defaultStatusId={defaultStatus?.id}
      />
    </div>
  )
}
