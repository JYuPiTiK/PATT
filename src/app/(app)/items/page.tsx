import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ListChecks, Plus } from "lucide-react"
import { format } from "date-fns"
import { ItemsFilterBar } from "./ItemsFilterBar"

const TYPE_LABELS: Record<string, string> = {
  TASK: "Task",
  BUG: "Bug",
  FEATURE: "Feature",
  ENQUIRY: "Enquiry",
  NOTE: "Note",
  FOLLOW_UP: "Follow-up",
  DECISION: "Decision",
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-700",
  CRITICAL: "bg-red-100 text-red-700",
}

async function getItems(q?: string, type?: string, priority?: string) {
  return prisma.workItem.findMany({
    where: {
      archivedAt: null,
      approvalStatus: "APPROVED",
      ...(q && {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      }),
      ...(type && { type: type as never }),
      ...(priority && { priority: priority as never }),
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      project: { select: { id: true, name: true, color: true } },
      status: { select: { name: true, color: true } },
      assignee: { select: { name: true } },
    },
  })
}

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; priority?: string }>
}) {
  const { q, type, priority } = await searchParams
  const items = await getItems(q, type, priority)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Work Items</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""}
            {q || type || priority ? " matching filters" : " across all projects"}
          </p>
        </div>
      </div>

      <ItemsFilterBar defaultQ={q} defaultType={type} defaultPriority={priority} />

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center">
          <ListChecks className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="font-semibold">No items found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {q || type || priority ? "Try adjusting your filters" : "Create a work item from any project"}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-24">Type</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-24">Priority</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-32">Status</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-36">Project</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-24">Due</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-28">Assignee</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${item.project.id}/work-items/${item.id}`}
                      className="font-medium hover:underline line-clamp-1"
                    >
                      {item.title}
                    </Link>
                    {item.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {TYPE_LABELS[item.type] ?? item.type}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[item.priority] ?? ""}`}
                    >
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.status.color }}
                      />
                      <span className="text-xs text-muted-foreground">{item.status.name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${item.project.id}`}
                      className="flex items-center gap-1.5 hover:underline"
                    >
                      <span
                        className="h-2 w-2 rounded-sm shrink-0"
                        style={{ backgroundColor: item.project.color }}
                      />
                      <span className="text-xs truncate max-w-[100px]">{item.project.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {item.dueDate ? (
                      <span className={new Date(item.dueDate) < new Date() ? "text-destructive font-medium" : ""}>
                        {format(new Date(item.dueDate), "MMM d")}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {item.assignee?.name ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
