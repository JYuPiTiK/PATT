import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ItemType, ApprovalStatus } from "@prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: projectId } = await params
  const { searchParams } = new URL(req.url)
  const statusId = searchParams.get("statusId")
  const type = searchParams.get("type") as ItemType | null
  const assigneeId = searchParams.get("assigneeId")
  const versionId = searchParams.get("versionId")
  const approvalStatus = searchParams.get("approvalStatus") as ApprovalStatus | null
  const search = searchParams.get("search")
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = parseInt(searchParams.get("limit") ?? "50")

  const where = {
    projectId,
    ...(statusId && { statusId }),
    ...(type && { type }),
    ...(assigneeId && { assigneeId }),
    ...(versionId && { versionId }),
    ...(approvalStatus && { approvalStatus }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  }

  const [items, total] = await Promise.all([
    prisma.workItem.findMany({
      where,
      include: {
        status: true,
        assignee: true,
        version: true,
        _count: { select: { comments: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.workItem.count({ where }),
  ])

  return NextResponse.json({ items, total, page, limit })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: projectId } = await params
  const body = await req.json()

  const {
    title,
    description,
    type,
    priority = "MEDIUM",
    statusId,
    assigneeId,
    versionId,
    dueDate,
    internalNotes,
    clientSafeSummary,
    tags = [],
    metadata,
  } = body

  if (!title || !type || !statusId) {
    return NextResponse.json(
      { error: "title, type, and statusId are required" },
      { status: 400 }
    )
  }

  // Verify project exists
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

  const item = await prisma.workItem.create({
    data: {
      title,
      description,
      type,
      priority,
      statusId,
      projectId,
      assigneeId: assigneeId || null,
      versionId: versionId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      internalNotes,
      clientSafeSummary,
      tags,
      metadata,
      source: "MANUAL",
      approvalStatus: "APPROVED",
    },
    include: {
      status: true,
      assignee: true,
      version: true,
    },
  })

  // Log creation
  await prisma.activityLog.create({
    data: {
      workItemId: item.id,
      action: "CREATED",
      toValue: JSON.stringify({ title, type, priority }),
    },
  })

  return NextResponse.json(item, { status: 201 })
}
