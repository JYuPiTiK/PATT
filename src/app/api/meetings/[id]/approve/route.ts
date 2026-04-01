import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST body: { action: "approve"|"reject", itemIds: string[] }
// or { action: "approve_all"|"reject_all" } — bulk actions
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: meetingId } = await params
  const { action, itemIds } = await req.json()

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { workItems: true },
  })
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let targetIds: string[] = []

  if (action === "approve_all" || action === "reject_all") {
    targetIds = meeting.workItems
      .filter((i) => i.approvalStatus === "PENDING")
      .map((i) => i.id)
  } else if (Array.isArray(itemIds) && itemIds.length > 0) {
    targetIds = itemIds
  } else {
    return NextResponse.json({ error: "Provide itemIds or use bulk action" }, { status: 400 })
  }

  const newStatus = action === "approve" || action === "approve_all" ? "APPROVED" : "REJECTED"

  // Update all target items
  await prisma.workItem.updateMany({
    where: { id: { in: targetIds }, meetingId },
    data: { approvalStatus: newStatus },
  })

  // Log activity on each approved/rejected item
  await prisma.activityLog.createMany({
    data: targetIds.map((wid) => ({
      workItemId: wid,
      action: newStatus === "APPROVED" ? "APPROVED" : "REJECTED",
      toValue: `Via meeting review`,
    })),
  })

  // Recount and update meeting approval status
  const updatedItems = await prisma.workItem.findMany({
    where: { meetingId },
    select: { approvalStatus: true },
  })

  const pending = updatedItems.filter((i) => i.approvalStatus === "PENDING").length
  const approved = updatedItems.filter((i) => i.approvalStatus === "APPROVED").length
  const rejected = updatedItems.filter((i) => i.approvalStatus === "REJECTED").length

  const meetingApprovalStatus =
    pending === 0 ? (rejected === updatedItems.length ? "REJECTED" : "APPROVED") : "PENDING"

  const updatedMeeting = await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      itemsPending: pending,
      itemsApproved: approved,
      itemsRejected: rejected,
      approvalStatus: meetingApprovalStatus,
    },
  })

  return NextResponse.json({
    meeting: updatedMeeting,
    updated: targetIds.length,
    newStatus,
  })
}
