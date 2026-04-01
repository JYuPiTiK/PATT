import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ statusId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { statusId } = await params
  const { name, color, order, isArchived } = await req.json()

  const status = await prisma.workspaceStatus.update({
    where: { id: statusId },
    data: {
      ...(name !== undefined && { name }),
      ...(color !== undefined && { color }),
      ...(order !== undefined && { order }),
      ...(isArchived !== undefined && { isArchived }),
    },
  })
  return NextResponse.json(status)
}
