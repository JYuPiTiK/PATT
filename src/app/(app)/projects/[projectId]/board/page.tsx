import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { BoardShell } from "@/components/board/BoardShell"
import { type BoardCard } from "@/components/board/KanbanCard"

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default async function BoardPage({ params }: PageProps) {
  const { projectId } = await params

  const [project, statuses, versions, workItems] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.workspaceStatus.findMany({
      where: { isArchived: false },
      orderBy: { order: "asc" },
    }),
    prisma.version.findMany({
      where: { projectId, isArchived: false },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workItem.findMany({
      where: { projectId, approvalStatus: "APPROVED" },
      include: {
        assignee: { select: { name: true, avatarColor: true } },
        version: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  if (!project) notFound()

  const cards: BoardCard[] = workItems.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    priority: item.priority,
    statusId: item.statusId,
    assignee: item.assignee,
    version: item.version,
    dueDate: item.dueDate?.toISOString() ?? null,
    commentCount: item._count.comments,
    projectId,
  }))

  const columns = statuses.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
  }))

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <p className="text-muted-foreground">No work items yet for this project.</p>
        <Link
          href={`/projects/${projectId}/work-items/new`}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Create First Item
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] p-4 gap-4">
      <BoardShell
        projectId={projectId}
        columns={columns}
        cards={cards}
        versions={versions.map((v) => ({ id: v.id, name: v.name }))}
      />
    </div>
  )
}
