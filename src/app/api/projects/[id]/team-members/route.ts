import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: projectId } = await params
  const members = await prisma.teamMember.findMany({
    where: { projectId, isActive: true },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(members)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: projectId } = await params
  const { name, role, avatarColor } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const member = await prisma.teamMember.create({
    data: { projectId, name, role, avatarColor: avatarColor ?? "#94a3b8" },
  })
  return NextResponse.json(member, { status: 201 })
}
