import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { TeamMembersSettings } from "./TeamMembersSettings"
import { VersionsSettings } from "./VersionsSettings"
import { Separator } from "@/components/ui/separator"
import { ProjectEditForm } from "./ProjectEditForm"

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default async function ProjectSettingsPage({ params }: PageProps) {
  const { projectId } = await params

  const [project, teamMembers, versions] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.teamMember.findMany({
      where: { projectId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.version.findMany({
      where: { projectId, isArchived: false },
      orderBy: { createdAt: "asc" },
    }),
  ])

  if (!project) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Project Settings</h1>
        <p className="text-sm text-muted-foreground">{project.name}</p>
      </div>

      <ProjectEditForm project={project} />

      <Separator />

      <TeamMembersSettings
        projectId={projectId}
        initialMembers={teamMembers.map((m) => ({
          ...m,
          role: m.role ?? null,
        }))}
      />

      <Separator />

      <VersionsSettings
        projectId={projectId}
        initialVersions={versions.map((v) => ({
          ...v,
          description: v.description ?? null,
          releaseDate: v.releaseDate?.toISOString() ?? null,
        }))}
      />
    </div>
  )
}
