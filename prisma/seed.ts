import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // ─── Workspace Statuses ───────────────────────────────────────────────────
  const statusData = [
    { name: "Inbox",               color: "#94a3b8", order: 0, isDefault: true  },
    { name: "Pending Review",      color: "#f59e0b", order: 1, isDefault: false },
    { name: "To Do",               color: "#3b82f6", order: 2, isDefault: false },
    { name: "In Progress",         color: "#6366f1", order: 3, isDefault: false },
    { name: "Waiting on Internal", color: "#f97316", order: 4, isDefault: false },
    { name: "Waiting on Client",   color: "#a855f7", order: 5, isDefault: false },
    { name: "Blocked",             color: "#ef4444", order: 6, isDefault: false },
    { name: "Done",                color: "#22c55e", order: 7, isDefault: false },
    { name: "Archived",            color: "#64748b", order: 8, isDefault: false },
  ]

  for (const status of statusData) {
    await prisma.workspaceStatus.upsert({
      where: { id: `status-${status.order}` },
      update: {},
      create: { id: `status-${status.order}`, ...status },
    })
  }
  console.log("✓ Workspace statuses seeded")

  // ─── Sample Projects ──────────────────────────────────────────────────────
  const acme = await prisma.project.upsert({
    where: { slug: "acme-platform" },
    update: {},
    create: {
      name: "Acme Platform",
      slug: "acme-platform",
      description: "Main client product platform — web and mobile.",
      color: "#6366f1",
    },
  })

  const internalOps = await prisma.project.upsert({
    where: { slug: "internal-ops" },
    update: {},
    create: {
      name: "Internal Ops",
      slug: "internal-ops",
      description: "Internal tooling, processes, and team coordination.",
      color: "#10b981",
    },
  })
  console.log("✓ Projects seeded")

  // ─── Versions ─────────────────────────────────────────────────────────────
  for (const project of [acme, internalOps]) {
    const existingVersions = await prisma.version.count({ where: { projectId: project.id } })
    if (existingVersions === 0) {
      await prisma.version.createMany({
        data: [
          { name: "Backlog", order: 0, projectId: project.id },
          { name: "v1.0",    order: 1, projectId: project.id },
          { name: "v1.1",    order: 2, projectId: project.id },
          { name: "Future",  order: 3, projectId: project.id },
        ],
      })
    }
  }
  console.log("✓ Versions seeded")

  // ─── Team Members ─────────────────────────────────────────────────────────
  const acmeMembers = [
    { name: "Alice Chen",  role: "Backend Engineer" },
    { name: "Bob Martin",  role: "Frontend Engineer" },
    { name: "Carol Smith", role: "Designer"          },
  ]

  for (const member of acmeMembers) {
    const existing = await prisma.teamMember.findFirst({
      where: { projectId: acme.id, name: member.name },
    })
    if (!existing) {
      await prisma.teamMember.create({ data: { ...member, projectId: acme.id } })
    }
  }

  const internalMembers = [
    { name: "Dave Wilson", role: "PM"              },
    { name: "Eve Johnson", role: "Operations Lead" },
    { name: "Frank Lee",   role: "Developer"       },
  ]

  for (const member of internalMembers) {
    const existing = await prisma.teamMember.findFirst({
      where: { projectId: internalOps.id, name: member.name },
    })
    if (!existing) {
      await prisma.teamMember.create({ data: { ...member, projectId: internalOps.id } })
    }
  }
  console.log("✓ Team members seeded")

  console.log("\n✅ Seed complete!")
  console.log("\nLogin with:")
  console.log("  Email:    admin@patt.local")
  console.log("  Password: admin123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
