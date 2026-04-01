import { format } from "date-fns"

interface ActivityEntry {
  id: string
  action: string
  fromValue: string | null
  toValue: string | null
  createdAt: string
}

interface ActivityLogProps {
  entries: ActivityEntry[]
}

const ACTION_LABELS: Record<string, string> = {
  CREATED: "Created this item",
  UPDATED: "Updated",
  COMMENTED: "Commented",
  STATUS_CHANGED: "Changed status",
  ASSIGNED: "Assigned",
  APPROVED: "Approved",
  REJECTED: "Rejected",
}

function parseChanges(
  action: string,
  fromValue: string | null,
  toValue: string | null
): string {
  if (action === "CREATED") return "Created this work item"
  if (action === "COMMENTED") {
    const preview = toValue ? (toValue.length > 80 ? toValue.slice(0, 80) + "…" : toValue) : ""
    return preview ? `Commented: "${preview}"` : "Added a comment"
  }
  if (action === "UPDATED") {
    try {
      const changes = JSON.parse(toValue ?? "{}") as Record<
        string,
        { from: unknown; to: unknown }
      >
      const parts = Object.entries(changes).map(([field, change]) => {
        const label = field.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())
        return `${label}: ${String(change.from) || "none"} → ${String(change.to) || "none"}`
      })
      return parts.join(", ") || "Updated"
    } catch {
      return toValue ? `Updated: ${toValue}` : "Updated"
    }
  }
  if (fromValue && toValue) {
    return `${ACTION_LABELS[action] ?? action}: ${fromValue} → ${toValue}`
  }
  return ACTION_LABELS[action] ?? action
}

export function ActivityLog({ entries }: ActivityLogProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="flex gap-3 text-sm">
          <div className="relative flex flex-col items-center">
            <div className="h-2 w-2 rounded-full bg-border mt-1.5 flex-shrink-0" />
            <div className="w-px flex-1 bg-border mt-1" />
          </div>
          <div className="pb-3 flex-1">
            <p className="text-foreground">{parseChanges(entry.action, entry.fromValue, entry.toValue)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
