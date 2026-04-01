import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface PageProps {
  params: Promise<{ meetingId: string }>
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

const MEETING_TYPE_LABELS: Record<string, string> = {
  STANDUP: "Stand-up",
  PLANNING: "Planning",
  REVIEW: "Review",
  CLIENT_CALL: "Client Call",
  RETROSPECTIVE: "Retrospective",
  AD_HOC: "Ad-hoc",
  OTHER: "Other",
}

export default async function MeetingDetailPage({ params }: PageProps) {
  const { meetingId } = await params

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      project: { select: { id: true, name: true, color: true } },
      workItems: {
        include: { status: true, assignee: true, version: true },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!meeting) notFound()

  const pendingItems = meeting.workItems.filter((i) => i.approvalStatus === "PENDING")
  const approvedItems = meeting.workItems.filter((i) => i.approvalStatus === "APPROVED")
  const rejectedItems = meeting.workItems.filter((i) => i.approvalStatus === "REJECTED")

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/meetings" className="hover:text-foreground">
          Meetings
        </Link>
        <span>/</span>
        <span className="text-foreground truncate">{meeting.title}</span>
      </nav>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/projects/${meeting.project.id}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: meeting.project.color }}
            />
            {meeting.project.name}
          </Link>
          <span className="text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground">
            {MEETING_TYPE_LABELS[meeting.meetingType] ?? meeting.meetingType}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground">
            {format(new Date(meeting.meetingDate), "MMMM d, yyyy")}
          </span>
          {meeting.approvalStatus === "PENDING" && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              Pending Review
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-semibold">{meeting.title}</h1>
        {meeting.participants.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Participants: {meeting.participants.join(", ")}
          </p>
        )}

        {meeting.approvalStatus === "PENDING" && pendingItems.length > 0 && (
          <div className="pt-1">
            <Button asChild size="sm">
              <Link href="/approval-queue">Review in Approval Queue →</Link>
            </Button>
          </div>
        )}
      </div>

      {/* AI Summary */}
      {meeting.aiSummary && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-4 space-y-2">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-400">AI Summary</p>
          <p className="text-sm">{meeting.aiSummary}</p>
        </div>
      )}

      {/* Decisions & Questions */}
      {(meeting.decisionsMade || meeting.openQuestions) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {meeting.decisionsMade && (
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-medium">Key Decisions</p>
              <ul className="space-y-1">
                {meeting.decisionsMade.split("\n").filter(Boolean).map((d, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-green-500 flex-shrink-0">✓</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {meeting.openQuestions && (
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-medium">Open Questions</p>
              <ul className="space-y-1">
                {meeting.openQuestions.split("\n").filter(Boolean).map((q, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-amber-500 flex-shrink-0">?</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Work Items */}
      {meeting.workItems.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold">
            Work Items ({meeting.workItems.length})
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {approvedItems.length} approved · {pendingItems.length} pending · {rejectedItems.length} rejected
            </span>
          </h2>

          <div className="space-y-2">
            {meeting.workItems.map((item) => (
              <Link
                key={item.id}
                href={`/projects/${meeting.project.id}/work-items/${item.id}`}
                className="block rounded-lg border p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[item.type] ?? "bg-slate-100"}`}
                      >
                        {item.type.replace("_", " ")}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: item.status.color }}
                        />
                        {item.status.name}
                      </span>
                      {item.assignee && (
                        <span className="text-xs text-muted-foreground">
                          → {item.assignee.name}
                        </span>
                      )}
                      {item.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          Due {format(new Date(item.dueDate), "MMM d")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium">{item.title}</p>
                  </div>

                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
                      item.approvalStatus === "APPROVED"
                        ? "text-green-600 border-green-300"
                        : item.approvalStatus === "REJECTED"
                        ? "text-muted-foreground border-muted"
                        : "text-amber-600 border-amber-300"
                    }`}
                  >
                    {item.approvalStatus === "APPROVED"
                      ? "Approved"
                      : item.approvalStatus === "REJECTED"
                      ? "Rejected"
                      : "Pending"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Raw Notes */}
      <div className="space-y-2">
        <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
          Raw Notes
        </h2>
        <pre className="rounded-lg border bg-muted/30 p-4 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-96">
          {meeting.rawNotes}
        </pre>
      </div>
    </div>
  )
}
