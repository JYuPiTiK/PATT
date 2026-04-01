"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Project = { id: string; name: string; color: string }

const MEETING_TYPES = [
  { value: "STANDUP", label: "Stand-up" },
  { value: "PLANNING", label: "Planning" },
  { value: "REVIEW", label: "Review" },
  { value: "CLIENT_CALL", label: "Client Call" },
  { value: "RETROSPECTIVE", label: "Retrospective" },
  { value: "AD_HOC", label: "Ad-hoc" },
  { value: "OTHER", label: "Other" },
]

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

interface ExtractedItem {
  id: string
  title: string
  description?: string
  type: string
  priority: string
  assigneeName?: string
  dueDate?: string | null
  tags: string[]
  internalNotes?: string
  clientSafeSummary?: string
  metadata?: Record<string, string>
  // UI state
  _selected: boolean
  _index: number
}

interface MeetingIntakeFormProps {
  projects: Project[]
  defaultProjectId?: string
}

type Step = "form" | "extracting" | "review"

export function MeetingIntakeForm({ projects, defaultProjectId }: MeetingIntakeFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>("form")

  // Form fields
  const [title, setTitle] = useState("")
  const [projectId, setProjectId] = useState(defaultProjectId ?? projects[0]?.id ?? "")
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split("T")[0])
  const [meetingType, setMeetingType] = useState("AD_HOC")
  const [participants, setParticipants] = useState("")
  const [rawNotes, setRawNotes] = useState("")
  const [runAI, setRunAI] = useState(true)

  // Extraction results
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([])
  const [aiSummary, setAiSummary] = useState("")
  const [savedMeetingId, setSavedMeetingId] = useState<string | null>(null)
  const [approving, setApproving] = useState(false)

  const handleExtract = async () => {
    if (!title.trim() || !rawNotes.trim() || !projectId) {
      toast.error("Please fill in title, project, and meeting notes")
      return
    }

    setStep("extracting")

    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          projectId,
          meetingDate,
          meetingType,
          participants: participants
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean),
          rawNotes,
          runAI,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to process meeting")
      }

      const meeting = await res.json()
      setSavedMeetingId(meeting.id)

      if (runAI && meeting.workItems?.length > 0) {
        setAiSummary(meeting.aiSummary ?? "")
        setExtractedItems(
          meeting.workItems.map((item: Record<string, unknown>, i: number) => ({
            ...item,
            _selected: true,
            _index: i,
          }))
        )
        setStep("review")
      } else {
        toast.success("Meeting saved successfully")
        router.push(`/meetings/${meeting.id}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
      setStep("form")
    }
  }

  const handleApprove = async () => {
    if (!savedMeetingId) return
    setApproving(true)

    const selectedIds = extractedItems
      .filter((i) => i._selected && i.id)
      .map((i) => i.id)

    const rejectedIds = extractedItems
      .filter((i) => !i._selected && i.id)
      .map((i) => i.id)

    try {
      if (selectedIds.length > 0) {
        await fetch(`/api/meetings/${savedMeetingId}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve", itemIds: selectedIds }),
        })
      }
      if (rejectedIds.length > 0) {
        await fetch(`/api/meetings/${savedMeetingId}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reject", itemIds: rejectedIds }),
        })
      }

      toast.success(`Meeting saved — ${selectedIds.length} item${selectedIds.length !== 1 ? "s" : ""} approved`)
      router.push(`/meetings/${savedMeetingId}`)
    } catch {
      toast.error("Failed to save approvals")
    } finally {
      setApproving(false)
    }
  }

  // ─── Step: Form ────────────────────────────────
  if (step === "form") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="title">Meeting Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sprint Planning — Week 22"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Project *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-sm inline-block"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Meeting Type</Label>
            <Select value={meetingType} onValueChange={setMeetingType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEETING_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meetingDate">Meeting Date</Label>
            <Input
              id="meetingDate"
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="participants">Participants</Label>
            <Input
              id="participants"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="Alice, Bob, Carol (comma-separated)"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rawNotes">Meeting Notes *</Label>
          <Textarea
            id="rawNotes"
            value={rawNotes}
            onChange={(e) => setRawNotes(e.target.value)}
            placeholder="Paste your raw meeting notes here — bullet points, transcript, or free text. The AI will extract actionable items."
            rows={14}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Tip: include names for assignees, dates for deadlines, and context about urgency.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-4 py-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">AI Extraction</p>
            <p className="text-xs text-muted-foreground">
              Claude will analyse your notes and suggest work items for review.
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={runAI}
              onChange={(e) => setRunAI(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm font-medium">Enable</span>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleExtract} disabled={!title || !rawNotes || !projectId}>
            {runAI ? "Extract with AI →" : "Save Meeting"}
          </Button>
        </div>
      </div>
    )
  }

  // ─── Step: Extracting ──────────────────────────
  if (step === "extracting") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-muted animate-ping opacity-30" />
          <div className="absolute inset-2 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <div>
          <p className="text-lg font-semibold">Analysing meeting notes…</p>
          <p className="text-sm text-muted-foreground mt-1">
            Claude is extracting work items. This takes 10–30 seconds.
          </p>
        </div>
      </div>
    )
  }

  // ─── Step: Review ──────────────────────────────
  if (step === "review") {
    const selected = extractedItems.filter((i) => i._selected).length

    return (
      <div className="space-y-6">
        {/* AI Summary */}
        {aiSummary && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-4">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">AI Summary</p>
            <p className="text-sm">{aiSummary}</p>
          </div>
        )}

        {/* Items to review */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">
              {extractedItems.length} item{extractedItems.length !== 1 ? "s" : ""} extracted
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setExtractedItems((prev) => prev.map((i) => ({ ...i, _selected: true })))
                }
              >
                Select all
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setExtractedItems((prev) => prev.map((i) => ({ ...i, _selected: false })))
                }
              >
                Deselect all
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {extractedItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() =>
                  setExtractedItems((prev) =>
                    prev.map((i) =>
                      i._index === item._index ? { ...i, _selected: !i._selected } : i
                    )
                  )
                }
                className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                  item._selected
                    ? "border-primary bg-primary/5"
                    : "border-muted opacity-50 hover:opacity-70"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item._selected}
                    onChange={() => {}}
                    className="mt-0.5 h-4 w-4 rounded flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[item.type] ?? "bg-slate-100"}`}
                      >
                        {item.type.replace("_", " ")}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[item.priority] ?? "bg-slate-100"}`}
                      >
                        {item.priority}
                      </span>
                      {item.assigneeName && (
                        <span className="text-xs text-muted-foreground">
                          → {item.assigneeName}
                        </span>
                      )}
                      {item.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          Due {format(new Date(item.dueDate), "MMM d")}
                        </span>
                      )}
                    </div>

                    <p className="font-medium text-sm">{item.title}</p>

                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}

                    {item.clientSafeSummary && (
                      <p className="text-xs text-green-700 dark:text-green-400 italic">
                        Client view: {item.clientSafeSummary}
                      </p>
                    )}

                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            {selected} of {extractedItems.length} item{extractedItems.length !== 1 ? "s" : ""} will be approved
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("form")}>
              Back
            </Button>
            <Button onClick={handleApprove} disabled={approving}>
              {approving ? "Saving…" : `Approve ${selected} Item${selected !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </div>
    )
  }

}
