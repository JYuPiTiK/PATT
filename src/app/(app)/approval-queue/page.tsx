import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { ApprovalQueueClient } from "./ApprovalQueueClient"

export default async function ApprovalQueuePage() {
  const meetings = await prisma.meeting.findMany({
    where: { approvalStatus: "PENDING" },
    include: {
      project: { select: { id: true, name: true, color: true } },
      workItems: {
        where: { approvalStatus: "PENDING" },
        include: { assignee: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const serialized = meetings.map((m) => ({
    ...m,
    meetingDate: m.meetingDate.toISOString(),
    workItems: m.workItems.map((i) => ({
      ...i,
      dueDate: i.dueDate?.toISOString() ?? null,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    })),
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }))

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Approval Queue</h1>
          <p className="text-sm text-muted-foreground">
            Review AI-extracted work items before they enter your workflow.
          </p>
        </div>
        <Button asChild>
          <Link href="/meetings/new">+ Log Meeting</Link>
        </Button>
      </div>

      <ApprovalQueueClient initialMeetings={serialized as Parameters<typeof ApprovalQueueClient>[0]["initialMeetings"]} />
    </div>
  )
}
