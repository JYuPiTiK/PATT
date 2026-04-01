"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type WorkspaceStatus = { id: string; name: string; color: string }
type TeamMember = { id: string; name: string; role: string | null }
type Version = { id: string; name: string }

interface WorkItemEditPanelProps {
  item: {
    id: string
    title: string
    description: string | null
    type: string
    priority: string
    statusId: string
    assigneeId: string | null
    versionId: string | null
    dueDate: string | null
    internalNotes: string | null
    clientSafeSummary: string | null
    tags: string[]
    approvalStatus: string
    metadata: Record<string, string> | null
  }
  statuses: WorkspaceStatus[]
  teamMembers: TeamMember[]
  versions: Version[]
}

const ITEM_TYPES = ["TASK", "BUG", "FEATURE", "ENQUIRY", "NOTE", "FOLLOW_UP", "DECISION"]
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

export function WorkItemEditPanel({
  item,
  statuses,
  teamMembers,
  versions,
}: WorkItemEditPanelProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [title, setTitle] = useState(item.title)
  const [description, setDescription] = useState(item.description ?? "")
  const [type, setType] = useState(item.type)
  const [priority, setPriority] = useState(item.priority)
  const [statusId, setStatusId] = useState(item.statusId)
  const [assigneeId, setAssigneeId] = useState(item.assigneeId ?? "")
  const [versionId, setVersionId] = useState(item.versionId ?? "")
  const [dueDate, setDueDate] = useState(
    item.dueDate ? new Date(item.dueDate).toISOString().split("T")[0] : ""
  )
  const [internalNotes, setInternalNotes] = useState(item.internalNotes ?? "")
  const [clientSafeSummary, setClientSafeSummary] = useState(item.clientSafeSummary ?? "")
  const [tags, setTags] = useState(item.tags.join(", "))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/work-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          priority,
          statusId,
          assigneeId: assigneeId || null,
          versionId: versionId || null,
          dueDate: dueDate || null,
          internalNotes,
          clientSafeSummary,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Saved")
      router.refresh()
    } catch {
      toast.error("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this work item? This cannot be undone.")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/work-items/${item.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Work item deleted")
      router.back()
    } catch {
      toast.error("Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ITEM_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t.charAt(0) + t.slice(1).toLowerCase().replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Priority</Label>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={statusId} onValueChange={setStatusId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Assignee</Label>
        <Select value={assigneeId} onValueChange={setAssigneeId}>
          <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Unassigned</SelectItem>
            {teamMembers.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Version</Label>
        <Select value={versionId} onValueChange={setVersionId}>
          <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {versions.map((v) => (
              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Due Date</Label>
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Internal Notes</Label>
        <Textarea
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Client-safe Summary</Label>
        <Textarea
          value={clientSafeSummary}
          onChange={(e) => setClientSafeSummary(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Tags</Label>
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="frontend, api (comma-separated)"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting}
          className="w-full"
        >
          {deleting ? "Deleting..." : "Delete Item"}
        </Button>
      </div>
    </div>
  )
}
