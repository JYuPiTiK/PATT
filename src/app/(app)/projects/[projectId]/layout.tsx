import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProjectNav } from "@/components/layout/ProjectNav"

interface ProjectLayoutProps {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const { projectId } = await params
  const project = await prisma.project.findUnique({
    where: { id: projectId, isArchived: false },
    select: { id: true, name: true, color: true },
  })

  if (!project) notFound()

  const tabs = [
    { label: "Overview", href: `/projects/${project.id}` },
    { label: "Board", href: `/projects/${project.id}/board` },
    { label: "List", href: `/projects/${project.id}/list` },
    { label: "Meetings", href: `/projects/${project.id}/meetings` },
    { label: "Settings", href: `/projects/${project.id}/settings` },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div
          className="h-4 w-4 rounded-sm shrink-0"
          style={{ backgroundColor: project.color }}
        />
        <h1 className="text-xl font-bold">{project.name}</h1>
      </div>

      <ProjectNav tabs={tabs} />

      <div className="pt-4">{children}</div>
    </div>
  )
}
