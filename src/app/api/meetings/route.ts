import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { extractWorkItemsFromNotes, type ExtractedItem } from "@/lib/ai-extraction"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  const approvalStatus = searchParams.get("approvalStatus")
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = parseInt(searchParams.get("limit") ?? "20")

  const meetings = await prisma.meeting.findMany({
    where: {
      ...(projectId && { projectId }),
      ...(approvalStatus && { approvalStatus: approvalStatus as "PENDING" | "APPROVED" | "REJECTED" }),
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      _count: { select: { workItems: true } },
    },
    orderBy: { meetingDate: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  })

  return NextResponse.json(meetings)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const {
    title,
    projectId,
    meetingDate,
    meetingType = "AD_HOC",
    participants = [],
    rawNotes,
    runAI = false,
  } = body

  if (!title || !projectId || !rawNotes || !meetingDate) {
    return NextResponse.json(
      { error: "title, projectId, meetingDate, and rawNotes are required" },
      { status: 400 }
    )
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, description: true },
  })
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

  let aiSummary: string | undefined
  let decisionsMade: string | undefined
  let openQuestions: string | undefined
  let extractedItems: ExtractedItem[] | undefined

  if (runAI) {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 503 }
      )
    }

    const projectContext = [
      `Project: ${project.name}`,
      project.description ? `Description: ${project.description}` : "",
    ]
      .filter(Boolean)
      .join("\n")

    const result = await extractWorkItemsFromNotes(rawNotes, projectContext)

    aiSummary = result.summary
    decisionsMade = result.keyDecisions.join("\n")
    openQuestions = result.openQuestions.join("\n")
    extractedItems = result.items
  }

  // Get default status (first status in order)
  const defaultStatus = await prisma.workspaceStatus.findFirst({
    where: { isArchived: false },
    orderBy: { order: "asc" },
  })

  const meeting = await prisma.$transaction(async (tx) => {
    const m = await tx.meeting.create({
      data: {
        title,
        projectId,
        meetingDate: new Date(meetingDate),
        meetingType,
        participants,
        rawNotes,
        aiSummary,
        decisionsMade,
        openQuestions,
        approvalStatus:
          runAI && extractedItems && extractedItems.length > 0 ? "PENDING" : "APPROVED",
        itemsPending: extractedItems?.length ?? 0,
      },
    })

    if (extractedItems && extractedItems.length > 0 && defaultStatus) {
      await tx.workItem.createMany({
        data: extractedItems.map((item) => ({
          title: item.title,
          description: item.description ?? null,
          type: item.type,
          priority: item.priority,
          statusId: defaultStatus.id,
          projectId,
          meetingId: m.id,
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
          internalNotes: item.internalNotes ?? null,
          clientSafeSummary: item.clientSafeSummary ?? null,
          tags: item.tags ?? [],
          metadata: item.metadata ?? Prisma.DbNull,
          source: "MEETING_INTAKE" as const,
          approvalStatus: "PENDING" as const,
        })),
      })
    }

    return tx.meeting.findUniqueOrThrow({
      where: { id: m.id },
      include: {
        project: { select: { id: true, name: true } },
        workItems: {
          include: { status: true, assignee: true, version: true },
        },
      },
    })
  })

  return NextResponse.json(meeting, { status: 201 })
}
