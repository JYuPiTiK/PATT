import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CheckSquare,
  AlertTriangle,
  Clock,
  Users,
  FolderKanban,
  Plus,
  ClipboardPaste,
} from "lucide-react"
import { format } from "date-fns"

async function getDashboardData() {
  const [pendingApprovals, overdueItems, waitingItems, recentMeetings, projects] = await Promise.all([
    // Pending approvals count
    prisma.workItem.count({
      where: { approvalStatus: "PENDING", archivedAt: null },
    }),
    // Overdue items (past due date, not done/archived)
    prisma.workItem.findMany({
      where: {
        dueDate: { lt: new Date() },
        archivedAt: null,
        approvalStatus: "APPROVED",
        status: {
          name: { notIn: ["Done", "Archived"] },
        },
      },
      take: 5,
      orderBy: { dueDate: "asc" },
      include: {
        project: { select: { name: true, color: true } },
        status: { select: { name: true, color: true } },
      },
    }),
    // Items waiting on internal/client
    prisma.workItem.count({
      where: {
        archivedAt: null,
        approvalStatus: "APPROVED",
        status: {
          name: { in: ["Waiting on Internal", "Waiting on Client"] },
        },
      },
    }),
    // Recent meetings
    prisma.meeting.findMany({
      take: 5,
      orderBy: { meetingDate: "desc" },
      include: {
        project: { select: { name: true, color: true } },
      },
    }),
    // All active projects
    prisma.project.findMany({
      where: { isArchived: false },
      orderBy: { name: "asc" },
      take: 8,
      include: {
        _count: {
          select: { workItems: { where: { archivedAt: null } } },
        },
      },
    }),
  ])

  return { pendingApprovals, overdueItems, waitingItems, recentMeetings, projects }
}

export default async function DashboardPage() {
  const { pendingApprovals, overdueItems, waitingItems, recentMeetings, projects } =
    await getDashboardData()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Your operations at a glance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/meetings/new">
              <ClipboardPaste className="h-4 w-4 mr-2" />
              Paste Meeting Notes
            </Link>
          </Button>
          <Button asChild>
            <Link href="/items/new">
              <Plus className="h-4 w-4 mr-2" />
              Quick Add
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/approval-queue">
          <Card className={`hover:shadow-md transition-shadow cursor-pointer ${pendingApprovals > 0 ? "border-amber-300" : ""}`}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
              <CheckSquare className={`h-4 w-4 ${pendingApprovals > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pendingApprovals}</p>
              <p className="text-xs text-muted-foreground mt-1">AI-extracted items awaiting review</p>
            </CardContent>
          </Card>
        </Link>

        <Card className={overdueItems.length > 0 ? "border-destructive/50" : ""}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Items</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${overdueItems.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{overdueItems.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Past their due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Waiting Items</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{waitingItems}</p>
            <p className="text-xs text-muted-foreground mt-1">Waiting on internal or client</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{projects.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/projects" className="hover:underline">View all</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Overdue items list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Overdue Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No overdue items</p>
            ) : (
              <div className="space-y-3">
                {overdueItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/items/${item.id}`} className="text-sm font-medium hover:underline truncate block">
                        {item.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="inline-block h-2 w-2 rounded-sm"
                          style={{ backgroundColor: item.project.color }}
                        />
                        <span className="text-xs text-muted-foreground">{item.project.name}</span>
                      </div>
                    </div>
                    <span className="text-xs text-destructive whitespace-nowrap shrink-0">
                      {item.dueDate ? format(item.dueDate, "MMM d") : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent meetings */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Meetings</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/meetings">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentMeetings.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">No meetings yet</p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/meetings/new">
                    <ClipboardPaste className="h-3 w-3 mr-2" />
                    Paste meeting notes
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/meetings/${meeting.id}`} className="text-sm font-medium hover:underline truncate block">
                        {meeting.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="inline-block h-2 w-2 rounded-sm"
                          style={{ backgroundColor: meeting.project.color }}
                        />
                        <span className="text-xs text-muted-foreground">{meeting.project.name}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {format(meeting.meetingDate, "MMM d")}
                      </span>
                      {meeting.approvalStatus === "PENDING" && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">Pending</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projects overview */}
      {projects.length > 0 && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              Projects
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/projects">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-2 rounded-md border p-3 hover:bg-muted/50 transition-colors"
                >
                  <span
                    className="h-3 w-3 rounded-sm shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-sm font-medium truncate">{project.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground shrink-0">
                    {project._count.workItems}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
