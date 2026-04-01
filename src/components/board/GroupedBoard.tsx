"use client"

import Link from "next/link"
import { format } from "date-fns"
import { type BoardCard } from "./KanbanCard"

const TYPE_LABELS: Record<string, string> = {
  TASK: "Tasks",
  BUG: "Bugs",
  FEATURE: "Features",
  ENQUIRY: "Enquiries",
  NOTE: "Notes",
  FOLLOW_UP: "Follow-ups",
  DECISION: "Decisions",
}

const TYPE_COLORS: Record<string, string> = {
  TASK: "#94a3b8",
  BUG: "#ef4444",
  FEATURE: "#3b82f6",
  ENQUIRY: "#f59e0b",
  NOTE: "#a855f7",
  FOLLOW_UP: "#f97316",
  DECISION: "#22c55e",
}

const PRIORITY_BORDER: Record<string, string> = {
  LOW: "border-l-slate-300",
  MEDIUM: "border-l-blue-400",
  HIGH: "border-l-orange-400",
  CRITICAL: "border-l-red-500",
}

function StaticCard({
  card,
  statusName,
}: {
  card: BoardCard
  statusName: string
}) {
  return (
    <Link
      href={`/projects/${card.projectId}/work-items/${card.id}`}
      className={`block rounded-md border bg-card border-l-4 ${PRIORITY_BORDER[card.priority] ?? "border-l-slate-300"} p-3 shadow-sm hover:shadow-md transition-shadow`}
    >
      <p className="text-sm font-medium leading-snug line-clamp-2 mb-2">{card.title}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs text-muted-foreground">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor:
                  statusName === "Done"
                    ? "#22c55e"
                    : "#94a3b8",
              }}
            />
            {statusName}
          </span>
          {card.version && (
            <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground truncate max-w-[5rem]">
              {card.version.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {card.dueDate && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(card.dueDate), "MMM d")}
            </span>
          )}
          {card.assignee && (
            <span
              className="h-5 w-5 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
              style={{ backgroundColor: card.assignee.avatarColor }}
              title={card.assignee.name}
            >
              {card.assignee.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

interface GroupedBoardProps {
  cards: BoardCard[]
  groupBy: "type" | "version"
  statusMap: Record<string, string> // statusId → status name
  versions: { id: string; name: string }[]
}

export function GroupedBoard({ cards, groupBy, statusMap, versions }: GroupedBoardProps) {
  if (groupBy === "type") {
    const TYPE_ORDER = ["TASK", "BUG", "FEATURE", "ENQUIRY", "NOTE", "FOLLOW_UP", "DECISION"]
    const grouped: Record<string, BoardCard[]> = {}
    for (const t of TYPE_ORDER) grouped[t] = []
    for (const card of cards) {
      if (grouped[card.type]) grouped[card.type].push(card)
    }

    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {TYPE_ORDER.filter((t) => grouped[t].length > 0 || true).map((type) => (
          <div key={type} className="flex flex-col w-[17rem] flex-shrink-0">
            <div className="flex items-center gap-2 mb-2 px-1">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: TYPE_COLORS[type] ?? "#94a3b8" }}
              />
              <span className="text-sm font-semibold">{TYPE_LABELS[type] ?? type}</span>
              <span className="text-xs text-muted-foreground">{grouped[type].length}</span>
            </div>
            <div className="flex flex-col gap-2 rounded-lg bg-muted/30 p-2 min-h-[6rem]">
              {grouped[type].map((card) => (
                <StaticCard
                  key={card.id}
                  card={card}
                  statusName={statusMap[card.statusId] ?? "—"}
                />
              ))}
              {grouped[type].length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">None</p>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Group by version
  const versionOrder = [...versions.map((v) => v.id), "__none__"]
  const versionNames: Record<string, string> = {
    __none__: "No Version",
    ...Object.fromEntries(versions.map((v) => [v.id, v.name])),
  }
  const grouped: Record<string, BoardCard[]> = {}
  for (const vid of versionOrder) grouped[vid] = []
  for (const card of cards) {
    const key = card.version?.id ?? "__none__"
    if (grouped[key]) grouped[key].push(card)
    else grouped["__none__"].push(card)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {versionOrder
        .filter((vid) => grouped[vid].length > 0 || vid !== "__none__")
        .map((vid) => (
          <div key={vid} className="flex flex-col w-[17rem] flex-shrink-0">
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-sm font-semibold">{versionNames[vid]}</span>
              <span className="text-xs text-muted-foreground">{grouped[vid].length}</span>
            </div>
            <div className="flex flex-col gap-2 rounded-lg bg-muted/30 p-2 min-h-[6rem]">
              {grouped[vid].map((card) => (
                <StaticCard
                  key={card.id}
                  card={card}
                  statusName={statusMap[card.statusId] ?? "—"}
                />
              ))}
              {grouped[vid].length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">None</p>
              )}
            </div>
          </div>
        ))}
    </div>
  )
}
