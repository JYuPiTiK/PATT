import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const meetings = await prisma.meeting.findMany({
    where: { approvalStatus: "PENDING" },
    include: {
      project: { select: { id: true, name: true, color: true } },
      workItems: {
        where: { approvalStatus: "PENDING" },
        include: { status: true, assignee: true, version: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(meetings)
}
