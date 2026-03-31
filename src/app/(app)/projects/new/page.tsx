"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const PROJECT_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#10b981",
  "#06b6d4", "#3b82f6",
]

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        description: formData.get("description") || undefined,
        color: selectedColor,
      }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error?.fieldErrors?.name?.[0] || "Failed to create project")
      return
    }

    const project = await res.json()
    router.push(`/projects/${project.id}`)
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to projects
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Project</CardTitle>
          <CardDescription>
            Create a project to organise work items, meetings, and team members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Project name *</Label>
              <Input id="name" name="name" placeholder="e.g. Acme Platform" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief description of this project..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-7 w-7 rounded-md transition-all ${
                      selectedColor === color ? "ring-2 ring-offset-2 ring-ring scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create project"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/projects">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
