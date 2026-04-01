"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TeamMember {
  id: string
  name: string
  role: string | null
  avatarColor: string
  isActive: boolean
}

interface TeamMembersSettingsProps {
  projectId: string
  initialMembers: TeamMember[]
}

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#94a3b8",
]

export function TeamMembersSettings({
  projectId,
  initialMembers,
}: TeamMembersSettingsProps) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers)
  const [newName, setNewName] = useState("")
  const [newRole, setNewRole] = useState("")
  const [newColor, setNewColor] = useState(AVATAR_COLORS[0])
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/team-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, role: newRole || null, avatarColor: newColor }),
      })
      if (!res.ok) throw new Error("Failed to add")
      const member = await res.json()
      setMembers((prev) => [...prev, member])
      setNewName("")
      setNewRole("")
      toast.success("Team member added")
    } catch {
      toast.error("Failed to add team member")
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/team-members/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to remove")
      setMembers((prev) => prev.filter((m) => m.id !== id))
      toast.success("Member removed")
    } catch {
      toast.error("Failed to remove member")
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Team Members</h3>

      <div className="rounded-lg border divide-y">
        {members.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No team members yet.</p>
        ) : (
          members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3">
              <span
                className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                style={{ backgroundColor: m.avatarColor }}
              >
                {m.name.charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{m.name}</p>
                {m.role && <p className="text-xs text-muted-foreground">{m.role}</p>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(m.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                Remove
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Add form */}
      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm font-medium">Add Member</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="newName">Name *</Label>
            <Input
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Jane Smith"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newRole">Role</Label>
            <Input
              id="newRole"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Developer"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Avatar Color</Label>
          <div className="flex gap-2">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className="h-6 w-6 rounded-full transition-transform hover:scale-110"
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
          {adding ? "Adding..." : "Add Member"}
        </Button>
      </div>
    </div>
  )
}
