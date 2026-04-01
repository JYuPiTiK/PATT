import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { WorkItemListClient } from "./WorkItemListClient"

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default async function ProjectListPage({ params }: PageProps) {
  const { projectId } = await params

  const [project, statuses, teamMembers, versions, workItems] = await Promise.all([
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
    prisma.workItem.findMany({
      where: { projectId },
      include: {
        status: true,
        assignee: true,
        version: true,
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ])

  if (!project) notFound()

  const serializedItems = workItems.map((item) => ({
    ...item,
    dueDate: item.dueDate?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Work Items</h1>
        <p className="text-sm text-muted-foreground">{project.name}</p>
      </div>
      <WorkItemListClient
        projectId={projectId}
        initialItems={serializedItems}
        statuses={statuses}
        teamMembers={teamMembers}
        versions={versions}
      />
    </div>
  )
}
