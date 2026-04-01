import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function ItemRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await prisma.workItem.findUnique({
    where: { id },
    select: { projectId: true },
  })
  if (!item) notFound()
  redirect(`/projects/${item.projectId}/work-items/${id}`)
}
