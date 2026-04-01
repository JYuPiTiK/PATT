import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { FolderKanban } from "lucide-react"

export default async function QuickAddPage() {
  const projects = await prisma.project.findMany({
    where: { isArchived: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  })

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quick Add</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose a project to add the work item to</p>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center">
          <FolderKanban className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No projects yet. Create a project first.</p>
          <Link href="/projects/new" className="mt-3 text-sm text-primary hover:underline">
            Create a project
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}/work-items/new`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
            >
              <span
                className="h-3 w-3 rounded-sm shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <span className="text-sm font-medium">{project.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
