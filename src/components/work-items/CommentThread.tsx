"use client"

import { useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface Comment {
  id: string
  body: string
  authorName: string
  isInternal: boolean
  createdAt: string
}

interface CommentThreadProps {
  workItemId: string
  initialComments: Comment[]
}

export function CommentThread({ workItemId, initialComments }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [body, setBody] = useState("")
  const [isInternal, setIsInternal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/work-items/${workItemId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, isInternal }),
      })
      if (!res.ok) throw new Error("Failed to post comment")
      const comment = await res.json()
      setComments((prev) => [...prev, comment])
      setBody("")
      toast.success("Comment added")
    } catch {
      toast.error("Failed to add comment")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Comments</h3>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`rounded-lg border p-3 ${
                c.isInternal
                  ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                  : "bg-card"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{c.authorName}</span>
                <div className="flex items-center gap-2">
                  {c.isInternal && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Internal
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(c.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="rounded"
            />
            <Label className="cursor-pointer">Internal only</Label>
          </label>
          <Button type="submit" size="sm" disabled={submitting || !body.trim()}>
            {submitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </form>
    </div>
  )
}
