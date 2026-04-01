import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const item = await prisma.workItem.findUnique({
    where: { id },
    include: {
      status: true,
      assignee: true,
      version: true,
      project: { select: { id: true, name: true, slug: true, color: true } },
      meeting: { select: { id: true, title: true, meetingDate: true } },
      comments: {
        orderBy: { createdAt: "asc" },
      },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  })

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(item)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const existing = await prisma.workItem.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const {
    title,
    description,
    type,
    priority,
    statusId,
    assigneeId,
    versionId,
    dueDate,
    internalNotes,
    clientSafeSummary,
    tags,
    metadata,
    approvalStatus,
  } = body

  // Track which fields changed for activity log
  const changes: Record<string, { from: unknown; to: unknown }> = {}
  if (title !== undefined && title !== existing.title) changes.title = { from: existing.title, to: title }
  if (statusId !== undefined && statusId !== existing.statusId) changes.statusId = { from: existing.statusId, to: statusId }
  if (priority !== undefined && priority !== existing.priority) changes.priority = { from: existing.priority, to: priority }
  if (assigneeId !== undefined && assigneeId !== existing.assigneeId) changes.assigneeId = { from: existing.assigneeId, to: assigneeId }
  if (versionId !== undefined && versionId !== existing.versionId) changes.versionId = { from: existing.versionId, to: versionId }

  const item = await prisma.workItem.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(type !== undefined && { type }),
      ...(priority !== undefined && { priority }),
      ...(statusId !== undefined && { statusId }),
      ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      ...(versionId !== undefined && { versionId: versionId || null }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(internalNotes !== undefined && { internalNotes }),
      ...(clientSafeSummary !== undefined && { clientSafeSummary }),
      ...(tags !== undefined && { tags }),
      ...(metadata !== undefined && { metadata }),
      ...(approvalStatus !== undefined && { approvalStatus }),
    },
    include: {
      status: true,
      assignee: true,
      version: true,
    },
  })

  // Log changes
  if (Object.keys(changes).length > 0) {
    await prisma.activityLog.create({
      data: {
        workItemId: id,
        action: "UPDATED",
        toValue: JSON.stringify(changes),
      },
    })
  }

  return NextResponse.json(item)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const existing = await prisma.workItem.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.workItem.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
