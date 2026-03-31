import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ListChecks, Users, CalendarDays, Tag, Plus } from "lucide-react"

export default async function ProjectOverviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const project = await prisma.project.findUnique({
    where: { id: projectId, isArchived: false },
    include: {
      teamMembers: { where: { isActive: true }, orderBy: { name: "asc" } },
      versions: { where: { isArchived: false }, orderBy: { order: "asc" } },
      _count: {
        select: {
          workItems: { where: { archivedAt: null } },
          meetings: true,
        },
      },
    },
  })

  if (!project) notFound()

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Work Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{project._count.workItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{project._count.meetings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{project.teamMembers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Versions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{project.versions.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Team Members
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/projects/${projectId}/settings`}>Manage</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {project.teamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No team members yet</p>
            ) : (
              <div className="space-y-2">
                {project.teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{member.name}</span>
                    {member.role && <span className="text-muted-foreground">{member.role}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4" /> Versions
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/projects/${projectId}/settings`}>Manage</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {project.versions.map((version) => (
                <Badge key={version.id} variant="outline">{version.name}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button asChild>
          <Link href={`/projects/${projectId}/board`}>View Board</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/meetings/new?projectId=${projectId}`}>
            <Plus className="h-4 w-4 mr-2" />
            Add Meeting Notes
          </Link>
        </Button>
      </div>
    </div>
  )
}
