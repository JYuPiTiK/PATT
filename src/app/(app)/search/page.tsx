import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { Search, FolderKanban, ListChecks, CalendarDays } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const TYPE_LABELS: Record<string, string> = {
  TASK: "Task", BUG: "Bug", FEATURE: "Feature", ENQUIRY: "Enquiry",
  NOTE: "Note", FOLLOW_UP: "Follow-up", DECISION: "Decision",
}

async function globalSearch(q: string) {
  const [workItems, meetings, projects] = await Promise.all([
    prisma.workItem.findMany({
      where: {
        archivedAt: null,
        approvalStatus: "APPROVED",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { tags: { has: q.toLowerCase() } },
        ],
      },
      take: 20,
      orderBy: { updatedAt: "desc" },
      include: {
        project: { select: { id: true, name: true, color: true } },
        status: { select: { name: true, color: true } },
      },
    }),
    prisma.meeting.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { aiSummary: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
      orderBy: { meetingDate: "desc" },
      include: {
        project: { select: { id: true, name: true, color: true } },
      },
    }),
    prisma.project.findMany({
      where: {
        isArchived: false,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
      orderBy: { name: "asc" },
      include: {
        _count: { select: { workItems: { where: { archivedAt: null } } } },
      },
    }),
  ])

  return { workItems, meetings, projects }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() ?? ""

  const isEmpty = !query

  const results = isEmpty ? null : await globalSearch(query)
  const total = results
    ? results.workItems.length + results.meetings.length + results.projects.length
    : 0

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Search</h1>
        {!isEmpty && (
          <p className="text-sm text-muted-foreground mt-1">
            {total} result{total !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
        )}
      </div>

      {isEmpty && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-20 text-center">
          <Search className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="font-semibold">Search across everything</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Use the search bar above to find work items, meetings, and projects
          </p>
        </div>
      )}

      {results && total === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center">
          <Search className="h-8 w-8 text-muted-foreground mb-3" />
          <h3 className="font-semibold">No results found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try a different keyword or check your spelling
          </p>
        </div>
      )}

      {results && results.workItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Work Items ({results.workItems.length})
          </h2>
          <div className="rounded-lg border divide-y">
            {results.workItems.map((item) => (
              <Link
                key={item.id}
                href={`/projects/${item.project.id}/work-items/${item.id}`}
                className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-sm"
                      style={{ backgroundColor: item.project.color }}
                    />
                    <span className="text-xs text-muted-foreground">{item.project.name}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{TYPE_LABELS[item.type] ?? item.type}</span>
                  </div>
                </div>
                <span className="flex items-center gap-1 shrink-0">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.status.color }}
                  />
                  <span className="text-xs text-muted-foreground">{item.status.name}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {results && results.meetings.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Meetings ({results.meetings.length})
          </h2>
          <div className="rounded-lg border divide-y">
            {results.meetings.map((meeting) => (
              <Link
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{meeting.title}</p>
                  {meeting.aiSummary && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{meeting.aiSummary}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-sm"
                      style={{ backgroundColor: meeting.project.color }}
                    />
                    <span className="text-xs text-muted-foreground">{meeting.project.name}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {format(new Date(meeting.meetingDate), "MMM d, yyyy")}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {results && results.projects.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            Projects ({results.projects.length})
          </h2>
          <div className="rounded-lg border divide-y">
            {results.projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <span
                  className="h-3 w-3 rounded-sm shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{project.name}</p>
                  {project.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {project._count.workItems} items
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
