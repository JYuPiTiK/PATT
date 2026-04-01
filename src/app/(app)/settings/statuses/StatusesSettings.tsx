"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface WorkspaceStatus {
  id: string
  name: string
  color: string
  order: number
  isDefault: boolean
}

const PRESET_COLORS = [
  "#94a3b8", "#3b82f6", "#6366f1", "#8b5cf6",
  "#22c55e", "#eab308", "#f97316", "#ef4444",
  "#ec4899", "#14b8a6",
]

export function StatusesSettings({ initialStatuses }: { initialStatuses: WorkspaceStatus[] }) {
  const [statuses, setStatuses] = useState<WorkspaceStatus[]>(initialStatuses)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    try {
      const res = await fetch("/api/workspace/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, color: newColor }),
      })
      if (!res.ok) throw new Error("Failed to add")
      const status = await res.json()
      setStatuses((prev) => [...prev, status])
      setNewName("")
      toast.success("Status added")
    } catch {
      toast.error("Failed to add status")
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (s: WorkspaceStatus) => {
    setEditingId(s.id)
    setEditName(s.name)
    setEditColor(s.color)
  }

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/workspace/statuses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, color: editColor }),
      })
      if (!res.ok) throw new Error("Failed to save")
      const updated = await res.json()
      setStatuses((prev) => prev.map((s) => (s.id === id ? updated : s)))
      setEditingId(null)
      toast.success("Status updated")
    } catch {
      toast.error("Failed to update status")
    }
  }

  const handleArchive = async (id: string) => {
    if (!confirm("Archive this status? Work items using it will keep their current status.")) return
    try {
      const res = await fetch(`/api/workspace/statuses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      })
      if (!res.ok) throw new Error("Failed to archive")
      setStatuses((prev) => prev.filter((s) => s.id !== id))
      toast.success("Status archived")
    } catch {
      toast.error("Failed to archive status")
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border divide-y">
        {statuses.map((s) => (
          <div key={s.id} className="p-3">
            {editingId === s.id ? (
              <div className="space-y-3">
                <div className="flex gap-3 items-center">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex gap-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className="h-5 w-5 rounded-full hover:scale-110 transition-transform"
                        style={{
                          backgroundColor: c,
                          outline: editColor === c ? `2px solid ${c}` : undefined,
                          outlineOffset: "1px",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleSaveEdit(s.id)}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-sm flex-1">{s.name}</span>
                {s.isDefault && (
                  <span className="text-xs text-muted-foreground">default</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(s)}
                  className="text-muted-foreground"
                >
                  Edit
                </Button>
                {!s.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchive(s.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Archive
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-medium">Add Status</p>
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="sName">Name</Label>
            <Input
              id="sName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="In Review"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Color</Label>
          <div className="flex gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className="h-6 w-6 rounded-full hover:scale-110 transition-transform"
                style={{
                  backgroundColor: c,
                  outline: newColor === c ? `2px solid ${c}` : undefined,
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>
        </div>
        <Button onClick={handleAdd} disabled={adding || !newName.trim()} size="sm">
          {adding ? "Adding..." : "Add Status"}
        </Button>
      </div>
    </div>
  )
}
