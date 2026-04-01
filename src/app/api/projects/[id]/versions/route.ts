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
  const versions = await prisma.version.findMany({
    where: { projectId, isArchived: false },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(versions)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: projectId } = await params
  const { name, description, releaseDate } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const version = await prisma.version.create({
    data: {
      projectId,
      name,
      description,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
    },
  })
  return NextResponse.json(version, { status: 201 })
}
