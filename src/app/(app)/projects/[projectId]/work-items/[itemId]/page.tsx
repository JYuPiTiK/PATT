import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { CommentThread } from "@/components/work-items/CommentThread"
import { ActivityLog } from "@/components/work-items/ActivityLog"
import { WorkItemEditPanel } from "@/components/work-items/WorkItemEditPanel"

interface PageProps {
  params: Promise<{ projectId: string; itemId: string }>
}

const TYPE_COLORS: Record<string, string> = {
  TASK: "bg-slate-100 text-slate-700",
  BUG: "bg-red-100 text-red-700",
  FEATURE: "bg-blue-100 text-blue-700",
  ENQUIRY: "bg-amber-100 text-amber-700",
  NOTE: "bg-purple-100 text-purple-700",
  FOLLOW_UP: "bg-orange-100 text-orange-700",
  DECISION: "bg-green-100 text-green-700",
}

export default async function WorkItemDetailPage({ params }: PageProps) {
  const { projectId, itemId } = await params

  const [item, statuses, teamMembers, versions] = await Promise.all([
    prisma.workItem.findUnique({
      where: { id: itemId },
      include: {
        status: true,
        assignee: true,
        version: true,
        project: { select: { id: true, name: true } },
        meeting: { select: { id: true, title: true, meetingDate: true } },
        comments: { orderBy: { createdAt: "asc" } },
        activityLogs: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    }),
    prisma.workspaceStatus.findMany({
      where: { isArchived: false },
      orderBy: { order: "asc" },
    }),
    prisma.teamMember.findMany({
      where: { projectId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.version.findMany({
      where: { projectId, isArchived: false },
      orderBy: { createdAt: "asc" },
    }),
  ])

  if (!item || item.projectId !== projectId) notFound()

  const typeLabel =
    item.type.charAt(0) + item.type.slice(1).toLowerCase().replace("_", " ")

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/projects/${projectId}`} className="hover:text-foreground">
            {item.project.name}
          </Link>
          <span>/</span>
          <Link href={`/projects/${projectId}/list`} className="hover:text-foreground">
            Work Items
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-xs">{item.title}</span>
        </nav>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                TYPE_COLORS[item.type] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              {typeLabel}
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.status.color }}
              />
              {item.status.name}
            </span>
            {item.version && (
              <Badge variant="outline">{item.version.name}</Badge>
            )}
            {item.approvalStatus === "PENDING" && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Pending Approval
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-semibold">{item.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {item.assignee && (
              <span>Assigned to <span className="text-foreground">{item.assignee.name}</span></span>
            )}
            {item.dueDate && (
              <span>Due <span className="text-foreground">{format(new Date(item.dueDate), "MMM d, yyyy")}</span></span>
            )}
            {item.meeting && (
              <span>
                From meeting:{" "}
                <Link
                  href={`/projects/${projectId}/meetings/${item.meeting.id}`}
                  className="text-foreground underline hover:no-underline"
                >
                  {item.meeting.title}
                </Link>
              </span>
            )}
            <span>Created {format(new Date(item.createdAt), "MMM d, yyyy")}</span>
          </div>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <div className="prose prose-sm max-w-none">
            <h3 className="text-base font-medium mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{item.description}</p>
          </div>
        )}

        {/* Type-specific metadata */}
        {item.metadata && typeof item.metadata === "object" && (
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-medium">
              {item.type === "BUG" && "Bug Details"}
              {item.type === "FEATURE" && "Feature Details"}
              {item.type === "ENQUIRY" && "Enquiry Details"}
            </h3>
            {Object.entries(item.metadata as Record<string, string>).map(([key, val]) => {
              if (!val) return null
              const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())
              return (
                <div key={key}>
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="text-sm whitespace-pre-wrap">{val}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Internal notes */}
        {item.internalNotes && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
            <h3 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
              Internal Notes
            </h3>
            <p className="text-sm whitespace-pre-wrap">{item.internalNotes}</p>
          </div>
        )}

        {/* Client-safe summary */}
        {item.clientSafeSummary && (
          <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-4">
            <h3 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
              Client-safe Summary
            </h3>
            <p className="text-sm whitespace-pre-wrap">{item.clientSafeSummary}</p>
          </div>
        )}

        {/* Comments */}
        <CommentThread
          workItemId={item.id}
          initialComments={item.comments.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
          }))}
        />

        {/* Activity */}
        <div>
          <h3 className="font-medium mb-3">Activity</h3>
          <ActivityLog
            entries={item.activityLogs.map((a) => ({
              id: a.id,
              action: a.action,
              fromValue: a.fromValue,
              toValue: a.toValue,
              createdAt: a.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>

      {/* Right sidebar — edit panel */}
      <aside className="w-72 border-l overflow-auto p-4 shrink-0">
        <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
          Details
        </h2>
        <WorkItemEditPanel
          item={{
            ...item,
            dueDate: item.dueDate?.toISOString() ?? null,
            metadata: item.metadata as Record<string, string> | null,
          }}
          statuses={statuses}
          teamMembers={teamMembers}
          versions={versions}
        />
      </aside>
    </div>
  )
}
