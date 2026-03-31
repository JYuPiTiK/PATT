import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isArchived: z.boolean().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      versions: { where: { isArchived: false }, orderBy: { order: "asc" } },
      teamMembers: { where: { isActive: true }, orderBy: { name: "asc" } },
      _count: {
        select: {
          workItems: { where: { archivedAt: null } },
          meetings: true,
        },
      },
    },
  })

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(project)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = updateProjectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const project = await prisma.project.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json(project)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  // Soft archive rather than hard delete
  const project = await prisma.project.update({
    where: { id },
    data: { isArchived: true },
  })

  return NextResponse.json(project)
}
