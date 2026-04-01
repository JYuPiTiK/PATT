"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Link from "next/link"
import { format } from "date-fns"

export interface BoardCard {
  id: string
  title: string
  type: string
  priority: string
  statusId: string
  assignee: { name: string; avatarColor: string } | null
  version: { id: string; name: string } | null
  dueDate: string | null
  commentCount: number
  projectId: string
}

const TYPE_DOTS: Record<string, string> = {
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

interface KanbanCardProps {
  card: BoardCard
  isDragging?: boolean
}

export function KanbanCard({ card, isDragging = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group rounded-md border bg-card border-l-4 ${PRIORITY_BORDER[card.priority] ?? "border-l-slate-300"} p-3 shadow-sm cursor-grab active:cursor-grabbing select-none ${isDragging ? "shadow-lg rotate-1" : "hover:shadow-md"} transition-shadow`}
    >
      {/* Type dot + title */}
      <div className="flex items-start gap-2 mb-2">
        <span
          className="mt-1 h-2 w-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: TYPE_DOTS[card.type] ?? "#94a3b8" }}
        />
        <Link
          href={`/projects/${card.projectId}/work-items/${card.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-medium leading-snug line-clamp-2 hover:underline"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {card.title}
        </Link>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-2 min-w-0">
          {card.version && (
            <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground truncate max-w-[6rem]">
              {card.version.name}
            </span>
          )}
          {card.dueDate && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(card.dueDate), "MMM d")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {card.commentCount > 0 && (
            <span className="text-xs text-muted-foreground">{card.commentCount}💬</span>
          )}
          {card.assignee && (
            <span
              className="h-5 w-5 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0"
              style={{ backgroundColor: card.assignee.avatarColor }}
              title={card.assignee.name}
            >
              {card.assignee.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Overlay card used during drag (no useSortable hooks)
export function KanbanCardOverlay({ card }: { card: BoardCard }) {
  return (
    <div
      className={`rounded-md border bg-card border-l-4 ${PRIORITY_BORDER[card.priority] ?? "border-l-slate-300"} p-3 shadow-xl rotate-2 cursor-grabbing select-none`}
    >
      <div className="flex items-start gap-2 mb-2">
        <span
          className="mt-1 h-2 w-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: TYPE_DOTS[card.type] ?? "#94a3b8" }}
        />
        <span className="text-sm font-medium leading-snug line-clamp-2">{card.title}</span>
      </div>
    </div>
  )
}
