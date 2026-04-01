import Link from "next/link"
import { format } from "date-fns"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const MEETING_TYPE_LABELS: Record<string, string> = {
  STANDUP: "Stand-up",
  PLANNING: "Planning",
  REVIEW: "Review",
  CLIENT_CALL: "Client Call",
  RETROSPECTIVE: "Retrospective",
  AD_HOC: "Ad-hoc",
  OTHER: "Other",
}

export default async function MeetingsPage() {
  const meetings = await prisma.meeting.findMany({
    include: {
      project: { select: { id: true, name: true, color: true } },
      _count: { select: { workItems: true } },
    },
    orderBy: { meetingDate: "desc" },
    take: 100,
  })

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Meetings</h1>
          <p className="text-sm text-muted-foreground">All meeting logs across projects</p>
        </div>
        <Button asChild>
          <Link href="/meetings/new">+ Log Meeting</Link>
        </Button>
      </div>

      {meetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <p className="text-muted-foreground">No meetings logged yet.</p>
          <Button asChild>
            <Link href="/meetings/new">Log your first meeting</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Meeting</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-32">Type</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-36">Date</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-36">Project</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-24">Items</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-28">Status</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((m) => (
                <tr key={m.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/meetings/${m.id}`}
                      className="font-medium hover:underline"
                    >
                      {m.title}
                    </Link>
                    {m.aiSummary && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {m.aiSummary}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {MEETING_TYPE_LABELS[m.meetingType] ?? m.meetingType}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(m.meetingDate), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${m.project.id}`}
                      className="flex items-center gap-1.5 hover:underline"
                    >
                      <span
                        className="h-2 w-2 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: m.project.color }}
                      />
                      <span className="truncate max-w-[120px]">{m.project.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m._count.workItems}
                  </td>
                  <td className="px-4 py-3">
                    {m.approvalStatus === "PENDING" ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        Pending
                      </Badge>
                    ) : m.approvalStatus === "APPROVED" ? (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Rejected
                      </Badge>
                    )}
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
