"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Project {
  id: string
  name: string
  description: string | null
  color: string
}

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#94a3b8",
]

export function ProjectEditForm({ project }: { project: Project }) {
  const router = useRouter()
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? "")
  const [color, setColor] = useState(project.color)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, color }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Project updated")
      router.refresh()
    } catch {
      toast.error("Failed to save project")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">General</h3>
      <div className="space-y-1.5">
        <Label htmlFor="projName">Project Name</Label>
        <Input
          id="projName"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="projDesc">Description</Label>
        <Textarea
          id="projDesc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Color</Label>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-7 w-7 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                outline: color === c ? `2px solid ${c}` : undefined,
                outlineOffset: "2px",
              }}
            />
          ))}
        </div>
      </div>
      <Button onClick={handleSave} disabled={saving} size="sm">
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  )
}
