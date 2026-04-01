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

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, color: true } },
      workItems: {
        include: {
          status: true,
          assignee: true,
          version: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(meeting)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { title, meetingDate, meetingType, participants, rawNotes, approvalStatus } =
    await req.json()

  const meeting = await prisma.meeting.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(meetingDate !== undefined && { meetingDate: new Date(meetingDate) }),
      ...(meetingType !== undefined && { meetingType }),
      ...(participants !== undefined && { participants }),
      ...(rawNotes !== undefined && { rawNotes }),
      ...(approvalStatus !== undefined && { approvalStatus }),
    },
  })
  return NextResponse.json(meeting)
}
