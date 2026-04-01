"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const TYPE_COLORS: Record<string, string> = {
  TASK: "bg-slate-100 text-slate-700",
  BUG: "bg-red-100 text-red-700",
  FEATURE: "bg-blue-100 text-blue-700",
  ENQUIRY: "bg-amber-100 text-amber-700",
  NOTE: "bg-purple-100 text-purple-700",
  FOLLOW_UP: "bg-orange-100 text-orange-700",
  DECISION: "bg-green-100 text-green-700",
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
}

interface WorkItem {
  id: string
  title: string
  type: string
  priority: string
  description: string | null
  clientSafeSummary: string | null
  assignee: { name: string } | null
  dueDate: string | null
  tags: string[]
}

interface Meeting {
  id: string
  title: string
  meetingDate: string
  meetingType: string
  itemsPending: number
  aiSummary: string | null
  project: { id: string; name: string; color: string }
  workItems: WorkItem[]
}

interface ApprovalQueueClientProps {
  initialMeetings: Meeting[]
}

export function ApprovalQueueClient({ initialMeetings }: ApprovalQueueClientProps) {
  const router = useRouter()
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleBulk = async (meetingId: string, action: "approve_all" | "reject_all") => {
    setProcessingId(meetingId)
    try {
      const res = await fetch(`/api/meetings/${meetingId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error("Failed")
      const label = action === "approve_all" ? "approved" : "rejected"
      toast.success(`All items ${label}`)
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId))
      router.refresh()
    } catch {
      toast.error("Action failed")
    } finally {
      setProcessingId(null)
    }
  }

  const handleSingle = async (
    meetingId: string,
    itemId: string,
    action: "approve" | "reject"
  ) => {
    setProcessingId(itemId)
    try {
      const res = await fetch(`/api/meetings/${meetingId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, itemIds: [itemId] }),
      })
      if (!res.ok) throw new Error("Failed")

      setMeetings((prev) =>
        prev
          .map((m) => {
            if (m.id !== meetingId) return m
            const remaining = m.workItems.filter((i) => i.id !== itemId)
            if (remaining.length === 0) return null
            return { ...m, workItems: remaining, itemsPending: remaining.length }
          })
          .filter(Boolean) as Meeting[]
      )
      toast.success(action === "approve" ? "Item approved" : "Item rejected")
    } catch {
      toast.error("Action failed")
    } finally {
      setProcessingId(null)
    }
  }

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="text-4xl">✓</div>
        <div>
          <p className="text-lg font-semibold">All caught up!</p>
          <p className="text-sm text-muted-foreground">No meetings pending approval.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/meetings/new">Log a Meeting</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {meetings.map((meeting) => (
        <div key={meeting.id} className="rounded-lg border overflow-hidden">
          {/* Meeting header */}
          <div className="bg-muted/40 px-5 py-4 flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="h-3 w-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: meeting.project.color }}
                />
                <Link
                  href={`/projects/${meeting.project.id}`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {meeting.project.name}
                </Link>
                <span className="text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(meeting.meetingDate), "MMM d, yyyy")}
                </span>
                <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                  {meeting.itemsPending} pending
                </Badge>
              </div>
              <Link
                href={`/meetings/${meeting.id}`}
                className="font-semibold hover:underline"
              >
                {meeting.title}
              </Link>
              {meeting.aiSummary && (
                <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                  {meeting.aiSummary}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleBulk(meeting.id, "reject_all")}
                disabled={processingId === meeting.id}
              >
                Reject All
              </Button>
              <Button
                size="sm"
                onClick={() => handleBulk(meeting.id, "approve_all")}
                disabled={processingId === meeting.id}
              >
                Approve All
              </Button>
            </div>
          </div>

          {/* Items */}
          <div className="divide-y">
            {meeting.workItems.map((item) => (
              <div key={item.id} className="px-5 py-4 flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[item.type] ?? "bg-slate-100"}`}
                    >
                      {item.type.replace("_", " ")}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[item.priority] ?? "bg-slate-100"}`}
                    >
                      {item.priority}
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

                  <p className="font-medium text-sm">{item.title}</p>

                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {item.clientSafeSummary && (
                    <p className="text-xs text-green-700 dark:text-green-400 italic">
                      Client view: {item.clientSafeSummary}
                    </p>
                  )}

                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => handleSingle(meeting.id, item.id, "reject")}
                    disabled={processingId === item.id}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSingle(meeting.id, item.id, "approve")}
                    disabled={processingId === item.id}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
