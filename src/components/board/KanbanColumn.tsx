"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import Link from "next/link"
import { KanbanCard, type BoardCard } from "./KanbanCard"

interface KanbanColumnProps {
  id: string
  title: string
  color: string
  cards: BoardCard[]
  projectId: string
  addHref?: string
}

export function KanbanColumn({
  id,
  title,
  color,
  cards,
  projectId,
  addHref,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex flex-col w-[17rem] flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm font-semibold truncate">{title}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{cards.length}</span>
        </div>
        {addHref && (
          <Link
            href={addHref}
            className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
            title="Add item"
          >
            +
          </Link>
        )}
      </div>

      {/* Cards drop zone */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-[6rem] rounded-lg p-2 transition-colors ${
          isOver ? "bg-accent/50 ring-2 ring-ring ring-inset" : "bg-muted/30"
        }`}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} />
          ))}
        </SortableContext>

        {cards.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4 select-none">
            Drop here
          </p>
        )}
      </div>
    </div>
  )
}
