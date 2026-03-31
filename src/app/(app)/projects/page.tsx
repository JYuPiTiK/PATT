import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, FolderKanban, Users, ListChecks } from "lucide-react"
import { ProjectSearch } from "./ProjectSearch"

async function getProjects(search?: string) {
  return prisma.project.findMany({
    where: {
      isArchived: false,
      ...(search && { name: { contains: search, mode: "insensitive" } }),
    },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          workItems: { where: { archivedAt: null } },
          teamMembers: { where: { isActive: true } },
        },
      },
    },
  })
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const projects = await getProjects(search)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground text-sm">
            {projects.length} active project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      <ProjectSearch defaultValue={search} />

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center">
          <FolderKanban className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="font-semibold">No projects yet</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">
            Create your first project to get started
          </p>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              Create project
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-sm shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <CardTitle className="text-base truncate">{project.name}</CardTitle>
                  </div>
                  {project.description && (
                    <CardDescription className="line-clamp-2 text-xs">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ListChecks className="h-3 w-3" />
                      {project._count.workItems} items
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {project._count.teamMembers} members
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
