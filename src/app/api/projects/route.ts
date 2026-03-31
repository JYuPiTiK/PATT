import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const search = req.nextUrl.searchParams.get("search") || ""
  const includeArchived = req.nextUrl.searchParams.get("archived") === "true"

  const projects = await prisma.project.findMany({
    where: {
      ...(search && {
        name: { contains: search, mode: "insensitive" },
      }),
      ...(!includeArchived && { isArchived: false }),
    },
    orderBy: [{ isArchived: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          workItems: { where: { archivedAt: null } },
          meetings: true,
          teamMembers: { where: { isActive: true } },
        },
      },
    },
  })

  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = createProjectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, description, color } = parsed.data

  // Generate unique slug
  let slug = slugify(name)
  const existing = await prisma.project.findFirst({ where: { slug } })
  if (existing) {
    slug = `${slug}-${Date.now()}`
  }

  const project = await prisma.$transaction(async (tx) => {
    const newProject = await tx.project.create({
      data: { name, description, color: color || "#6366f1", slug },
    })

    // Seed default versions for this project
    await tx.version.createMany({
      data: [
        { name: "Backlog", order: 0, projectId: newProject.id },
        { name: "v1.0", order: 1, projectId: newProject.id },
        { name: "v1.1", order: 2, projectId: newProject.id },
        { name: "Future", order: 3, projectId: newProject.id },
      ],
    })

    return newProject
  })

  return NextResponse.json(project, { status: 201 })
}
