import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PageProps {
  params: Promise<{ projectId: string }>
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

export default async function ProjectMeetingsPage({ params }: PageProps) {
  const { projectId } = await params

  const [project, meetings] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.meeting.findMany({
      where: { projectId },
      include: { _count: { select: { workItems: true } } },
      orderBy: { meetingDate: "desc" },
    }),
  ])

  if (!project) notFound()

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Meetings</h2>
        <Button asChild size="sm">
          <Link href={`/meetings/new?projectId=${projectId}`}>+ Log Meeting</Link>
        </Button>
      </div>

      {meetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <p className="text-muted-foreground">No meetings logged for this project yet.</p>
          <Button asChild size="sm">
            <Link href={`/meetings/new?projectId=${projectId}`}>Log first meeting</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {meetings.map((m) => (
            <Link
              key={m.id}
              href={`/meetings/${m.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{m.title}</span>
                  {m.approvalStatus === "PENDING" && (
                    <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                      Pending
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {MEETING_TYPE_LABELS[m.meetingType] ?? m.meetingType} ·{" "}
                  {format(new Date(m.meetingDate), "MMM d, yyyy")} ·{" "}
                  {m._count.workItems} item{m._count.workItems !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="text-muted-foreground text-xs">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
