"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type WorkspaceStatus = { id: string; name: string; color: string }
type TeamMember = { id: string; name: string }
type Version = { id: string; name: string }

interface WorkItem {
  id: string
  title: string
  type: string
  priority: string
  status: WorkspaceStatus
  assignee: TeamMember | null
  version: Version | null
  dueDate: string | null
  approvalStatus: string
  createdAt: string
  _count: { comments: number }
}

interface WorkItemListClientProps {
  projectId: string
  initialItems: WorkItem[]
  statuses: WorkspaceStatus[]
  teamMembers: TeamMember[]
  versions: Version[]
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

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
}

export function WorkItemListClient({
  projectId,
  initialItems,
  statuses,
  teamMembers,
  versions,
}: WorkItemListClientProps) {
  const router = useRouter()
  const [items, setItems] = useState<WorkItem[]>(initialItems)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterType, setFilterType] = useState("")
  const [filterAssignee, setFilterAssignee] = useState("")
  const [filterVersion, setFilterVersion] = useState("")

  const fetchItems = useCallback(
    async (params: {
      search?: string
      statusId?: string
      type?: string
      assigneeId?: string
      versionId?: string
    }) => {
      setLoading(true)
      try {
        const query = new URLSearchParams()
        if (params.search) query.set("search", params.search)
        if (params.statusId) query.set("statusId", params.statusId)
        if (params.type) query.set("type", params.type)
        if (params.assigneeId) query.set("assigneeId", params.assigneeId)
        if (params.versionId) query.set("versionId", params.versionId)

        const res = await fetch(
          `/api/projects/${projectId}/work-items?${query.toString()}`
        )
        const data = await res.json()
        setItems(data.items)
      } catch {
        toast.error("Failed to load items")
      } finally {
        setLoading(false)
      }
    },
    [projectId]
  )

  const applyFilters = (overrides: Partial<{
    search: string
    statusId: string
    type: string
    assigneeId: string
    versionId: string
  }> = {}) => {
    fetchItems({
      search: overrides.search ?? search,
      statusId: overrides.statusId ?? filterStatus,
      type: overrides.type ?? filterType,
      assigneeId: overrides.assigneeId ?? filterAssignee,
      versionId: overrides.versionId ?? filterVersion,
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            applyFilters({ search: e.target.value })
          }}
          className="w-48"
        />

        <Select
          value={filterStatus}
          onValueChange={(v) => {
            const val = v === "ALL" ? "" : v
            setFilterStatus(val)
            applyFilters({ statusId: val })
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterType}
          onValueChange={(v) => {
            const val = v === "ALL" ? "" : v
            setFilterType(val)
            applyFilters({ type: val })
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {["TASK", "BUG", "FEATURE", "ENQUIRY", "NOTE", "FOLLOW_UP", "DECISION"].map(
              (t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase().replace("_", " ")}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        {teamMembers.length > 0 && (
          <Select
            value={filterAssignee}
            onValueChange={(v) => {
              const val = v === "ALL" ? "" : v
              setFilterAssignee(val)
              applyFilters({ assigneeId: val })
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All assignees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All assignees</SelectItem>
              {teamMembers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {versions.length > 0 && (
          <Select
            value={filterVersion}
            onValueChange={(v) => {
              const val = v === "ALL" ? "" : v
              setFilterVersion(val)
              applyFilters({ versionId: val })
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All versions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All versions</SelectItem>
              {versions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="ml-auto">
          <Button asChild size="sm">
            <Link href={`/projects/${projectId}/work-items/new`}>+ New Item</Link>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Title</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-24">Type</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-24">Priority</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-28">Status</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-28">Assignee</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-24">Due</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-16">Notes</th>
            </tr>
          </thead>
          <tbody className={loading ? "opacity-50" : ""}>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  No work items found.{" "}
                  <Link
                    href={`/projects/${projectId}/work-items/new`}
                    className="underline hover:text-foreground"
                  >
                    Create one.
                  </Link>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t hover:bg-muted/30 cursor-pointer"
                  onClick={() => router.push(`/projects/${projectId}/work-items/${item.id}`)}
                >
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        TYPE_COLORS[item.type] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.type.charAt(0) + item.type.slice(1).toLowerCase().replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        PRIORITY_COLORS[item.priority] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.priority.charAt(0) + item.priority.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.status.color }}
                      />
                      <span className="truncate">{item.status.name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.assignee?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {item.dueDate
                      ? format(new Date(item.dueDate), "MMM d")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {item._count.comments > 0 ? `${item._count.comments} 💬` : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</p>
    </div>
  )
}
