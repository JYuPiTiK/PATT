import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { versionId } = await params
  const { name, description, releaseDate, isArchived } = await req.json()

  const version = await prisma.version.update({
    where: { id: versionId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(releaseDate !== undefined && { releaseDate: releaseDate ? new Date(releaseDate) : null }),
      ...(isArchived !== undefined && { isArchived }),
    },
  })
  return NextResponse.json(version)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { versionId } = await params
  const version = await prisma.version.update({
    where: { id: versionId },
    data: { isArchived: true },
  })
  return NextResponse.json(version)
}
