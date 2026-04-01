import { prisma } from "@/lib/prisma"
import { StatusesSettings } from "./StatusesSettings"

export default async function WorkspaceStatusesPage() {
  const statuses = await prisma.workspaceStatus.findMany({
    where: { isArchived: false },
    orderBy: { order: "asc" },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Workflow Statuses</h1>
        <p className="text-sm text-muted-foreground">
          Manage the statuses used across all projects. Changes apply workspace-wide.
        </p>
      </div>
      <StatusesSettings initialStatuses={statuses} />
    </div>
  )
}
