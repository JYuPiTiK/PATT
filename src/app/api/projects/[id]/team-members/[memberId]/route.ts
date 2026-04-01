import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { memberId } = await params
  const { name, role, avatarColor, isActive } = await req.json()

  const member = await prisma.teamMember.update({
    where: { id: memberId },
    data: {
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(avatarColor !== undefined && { avatarColor }),
      ...(isActive !== undefined && { isActive }),
    },
  })
  return NextResponse.json(member)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { memberId } = await params
  // Soft-delete: mark inactive
  const member = await prisma.teamMember.update({
    where: { id: memberId },
    data: { isActive: false },
  })
  return NextResponse.json(member)
}
