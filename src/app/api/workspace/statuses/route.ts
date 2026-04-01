import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const statuses = await prisma.workspaceStatus.findMany({
    where: { isArchived: false },
    orderBy: { order: "asc" },
  })
  return NextResponse.json(statuses)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, color } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  // Place at end of order
  const max = await prisma.workspaceStatus.aggregate({ _max: { order: true } })
  const nextOrder = (max._max.order ?? 0) + 1

  const status = await prisma.workspaceStatus.create({
    data: { name, color: color ?? "#94a3b8", order: nextOrder },
  })
  return NextResponse.json(status, { status: 201 })
}
