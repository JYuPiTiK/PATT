"use client"

import { useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Version {
  id: string
  name: string
  description: string | null
  releaseDate: string | null
  isArchived: boolean
}

interface VersionsSettingsProps {
  projectId: string
  initialVersions: Version[]
}

export function VersionsSettings({ projectId, initialVersions }: VersionsSettingsProps) {
  const [versions, setVersions] = useState<Version[]>(initialVersions)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newRelease, setNewRelease] = useState("")
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDesc || null,
          releaseDate: newRelease || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to add")
      const version = await res.json()
      setVersions((prev) => [...prev, version])
      setNewName("")
      setNewDesc("")
      setNewRelease("")
      toast.success("Version added")
    } catch {
      toast.error("Failed to add version")
    } finally {
      setAdding(false)
    }
  }

  const handleArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/versions/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to archive")
      setVersions((prev) => prev.filter((v) => v.id !== id))
      toast.success("Version archived")
    } catch {
      toast.error("Failed to archive version")
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Versions</h3>

      <div className="rounded-lg border divide-y">
        {versions.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No versions yet.</p>
        ) : (
          versions.map((v) => (
            <div key={v.id} className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{v.name}</p>
                <p className="text-xs text-muted-foreground">
                  {v.description && <span>{v.description} · </span>}
                  {v.releaseDate
                    ? `Release: ${format(new Date(v.releaseDate), "MMM d, yyyy")}`
                    : "No release date"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleArchive(v.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                Archive
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-medium">Add Version</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="vName">Name *</Label>
            <Input
              id="vName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="v2.0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vRelease">Release Date</Label>
            <Input
              id="vRelease"
              type="date"
              value={newRelease}
              onChange={(e) => setNewRelease(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vDesc">Description</Label>
          <Input
            id="vDesc"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Optional description"
          />
        </div>
        <Button onClick={handleAdd} disabled={adding || !newName.trim()} size="sm">
          {adding ? "Adding..." : "Add Version"}
        </Button>
      </div>
    </div>
  )
}
