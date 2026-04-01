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

interface WorkItemFormProps {
  projectId: string
  statuses: WorkspaceStatus[]
  teamMembers: TeamMember[]
  versions: Version[]
  defaultStatusId?: string
}

const ITEM_TYPES = [
  { value: "TASK", label: "Task" },
  { value: "BUG", label: "Bug" },
  { value: "FEATURE", label: "Feature" },
  { value: "ENQUIRY", label: "Enquiry" },
  { value: "NOTE", label: "Note" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "DECISION", label: "Decision" },
]

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
]

export function WorkItemForm({
  projectId,
  statuses,
  teamMembers,
  versions,
  defaultStatusId,
}: WorkItemFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("TASK")
  const [priority, setPriority] = useState("MEDIUM")
  const [statusId, setStatusId] = useState(defaultStatusId ?? statuses[0]?.id ?? "")
  const [assigneeId, setAssigneeId] = useState("")
  const [versionId, setVersionId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [internalNotes, setInternalNotes] = useState("")
  const [tags, setTags] = useState("")

  // Type-specific metadata
  const [bugSteps, setBugSteps] = useState("")
  const [bugExpected, setBugExpected] = useState("")
  const [bugActual, setBugActual] = useState("")
  const [featureGoal, setFeatureGoal] = useState("")
  const [featureValue, setFeatureValue] = useState("")
  const [enquiryAskedBy, setEnquiryAskedBy] = useState("")
  const [enquiryResponseFrom, setEnquiryResponseFrom] = useState("")

  const buildMetadata = () => {
    if (type === "BUG") {
      return {
        stepsToReproduce: bugSteps,
        expectedBehavior: bugExpected,
        actualBehavior: bugActual,
      }
    }
    if (type === "FEATURE") {
      return {
        businessGoal: featureGoal,
        userValue: featureValue,
      }
    }
    if (type === "ENQUIRY") {
      return {
        askedBy: enquiryAskedBy,
        responseNeededFrom: enquiryResponseFrom,
      }
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !statusId) {
      toast.error("Title and status are required")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/work-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          priority,
          statusId,
          assigneeId: assigneeId || undefined,
          versionId: versionId || undefined,
          dueDate: dueDate || undefined,
          internalNotes,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          metadata: buildMetadata(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to create work item")
      }

      toast.success("Work item created")
      router.push(`/projects/${projectId}/list`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Core fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of the work item"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label>Type *</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEM_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Status *</Label>
          <Select value={statusId} onValueChange={setStatusId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full inline-block"
                      style={{ backgroundColor: s.color }}
                    />
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
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {teamMembers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                  {m.role && (
                    <span className="text-muted-foreground ml-1">· {m.role}</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Version</Label>
          <Select value={versionId} onValueChange={setVersionId}>
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {versions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed description..."
          rows={3}
        />
      </div>

      {/* Bug-specific fields */}
      {type === "BUG" && (
        <div className="space-y-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">Bug Details</p>
          <div className="space-y-1.5">
            <Label htmlFor="bugSteps">Steps to Reproduce</Label>
            <Textarea
              id="bugSteps"
              value={bugSteps}
              onChange={(e) => setBugSteps(e.target.value)}
              placeholder="1. Go to...\n2. Click on...\n3. See error"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bugExpected">Expected Behavior</Label>
              <Textarea
                id="bugExpected"
                value={bugExpected}
                onChange={(e) => setBugExpected(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bugActual">Actual Behavior</Label>
              <Textarea
                id="bugActual"
                value={bugActual}
                onChange={(e) => setBugActual(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>
      )}

      {/* Feature-specific fields */}
      {type === "FEATURE" && (
        <div className="space-y-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Feature Details</p>
          <div className="space-y-1.5">
            <Label htmlFor="featureGoal">Business Goal</Label>
            <Textarea
              id="featureGoal"
              value={featureGoal}
              onChange={(e) => setFeatureGoal(e.target.value)}
              placeholder="Why does this feature matter to the business?"
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="featureValue">User Value</Label>
            <Textarea
              id="featureValue"
              value={featureValue}
              onChange={(e) => setFeatureValue(e.target.value)}
              placeholder="How does this improve the user experience?"
              rows={2}
            />
          </div>
        </div>
      )}

      {/* Enquiry-specific fields */}
      {type === "ENQUIRY" && (
        <div className="space-y-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Enquiry Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="enquiryAskedBy">Asked By</Label>
              <Input
                id="enquiryAskedBy"
                value={enquiryAskedBy}
                onChange={(e) => setEnquiryAskedBy(e.target.value)}
                placeholder="Client name or team member"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="enquiryResponseFrom">Response Needed From</Label>
              <Input
                id="enquiryResponseFrom"
                value={enquiryResponseFrom}
                onChange={(e) => setEnquiryResponseFrom(e.target.value)}
                placeholder="Who should answer this?"
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="internalNotes">Internal Notes</Label>
        <Textarea
          id="internalNotes"
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          placeholder="Notes visible only to the team..."
          rows={2}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="frontend, api, urgent (comma-separated)"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Work Item"}
        </Button>
      </div>
    </form>
  )
}
