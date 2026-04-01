import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: workItemId } = await params
  const { body, isInternal = false } = await req.json()

  if (!body?.trim()) {
    return NextResponse.json({ error: "Comment body is required" }, { status: 400 })
  }

  const item = await prisma.workItem.findUnique({ where: { id: workItemId } })
  if (!item) return NextResponse.json({ error: "Work item not found" }, { status: 404 })

  const comment = await prisma.comment.create({
    data: {
      workItemId,
      body,
      isInternal,
      authorName: session.user?.name ?? session.user?.email ?? "Admin",
    },
  })

  await prisma.activityLog.create({
    data: {
      workItemId,
      action: "COMMENTED",
      toValue: body.slice(0, 200),
    },
  })

  return NextResponse.json(comment, { status: 201 })
}
