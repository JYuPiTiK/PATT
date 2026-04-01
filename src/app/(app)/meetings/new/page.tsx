import { prisma } from "@/lib/prisma"
import { MeetingIntakeForm } from "@/components/meetings/MeetingIntakeForm"

interface PageProps {
  searchParams: Promise<{ projectId?: string }>
}

export default async function NewMeetingPage({ searchParams }: PageProps) {
  const { projectId } = await searchParams

  const projects = await prisma.project.findMany({
    where: { isArchived: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">New Meeting</h1>
        <p className="text-sm text-muted-foreground">
          Paste your meeting notes and let AI extract work items for review.
        </p>
      </div>
      <MeetingIntakeForm projects={projects} defaultProjectId={projectId} />
    </div>
  )
}
