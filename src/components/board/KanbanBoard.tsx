"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable"
import { toast } from "sonner"
import { KanbanColumn } from "./KanbanColumn"
import { KanbanCardOverlay, type BoardCard } from "./KanbanCard"

interface StatusColumn {
  id: string
  name: string
  color: string
}

interface KanbanBoardProps {
  projectId: string
  initialColumns: StatusColumn[]
  initialCards: BoardCard[]
}

export function KanbanBoard({ projectId, initialColumns, initialCards }: KanbanBoardProps) {
  // Map of statusId → card[]
  const buildColumnMap = (cards: BoardCard[], columns: StatusColumn[]) => {
    const map: Record<string, BoardCard[]> = {}
    for (const col of columns) map[col.id] = []
    for (const card of cards) {
      if (map[card.statusId]) {
        map[card.statusId].push(card)
      } else {
        // card has a status not in current columns — put it in first column
        const firstId = columns[0]?.id
        if (firstId) map[firstId].push(card)
      }
    }
    return map
  }

  const [columns] = useState<StatusColumn[]>(initialColumns)
  const [cards, setCards] = useState<BoardCard[]>(
    initialCards.map((c) => ({ ...c }))
  )
  const [columnMap, setColumnMap] = useState<Record<string, BoardCard[]>>(() =>
    buildColumnMap(initialCards, initialColumns)
  )
  const [activeCard, setActiveCard] = useState<BoardCard | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const findColumn = useCallback(
    (cardId: string): string | undefined => {
      for (const [colId, colCards] of Object.entries(columnMap)) {
        if (colCards.some((c) => c.id === cardId)) return colId
      }
    },
    [columnMap]
  )

  const handleDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      const card = cards.find((c) => c.id === active.id)
      setActiveCard(card ?? null)
    },
    [cards]
  )

  const handleDragOver = useCallback(
    ({ active, over }: DragOverEvent) => {
      if (!over) return
      const activeId = String(active.id)
      const overId = String(over.id)
      if (activeId === overId) return

      const activeColId = findColumn(activeId)
      // overId could be a column id or a card id
      const overColId = columnMap[overId]
        ? overId
        : findColumn(overId)

      if (!activeColId || !overColId || activeColId === overColId) return

      setColumnMap((prev) => {
        const activeCards = [...(prev[activeColId] ?? [])]
        const overCards = [...(prev[overColId] ?? [])]
        const activeIdx = activeCards.findIndex((c) => c.id === activeId)
        const overIdx = overCards.findIndex((c) => c.id === overId)

        const [moved] = activeCards.splice(activeIdx, 1)
        const insertAt = overIdx >= 0 ? overIdx : overCards.length
        overCards.splice(insertAt, 0, moved)

        return { ...prev, [activeColId]: activeCards, [overColId]: overCards }
      })
    },
    [columnMap, findColumn]
  )

  const handleDragEnd = useCallback(
    async ({ active, over }: DragEndEvent) => {
      setActiveCard(null)
      if (!over) return

      const activeId = String(active.id)
      const overId = String(over.id)

      const newColId = columnMap[overId] ? overId : findColumn(overId)
      if (!newColId) return

      const oldCard = cards.find((c) => c.id === activeId)
      if (!oldCard) return

      // If same column, just reorder in columnMap
      if (oldCard.statusId === newColId) {
        const colCards = [...(columnMap[newColId] ?? [])]
        const oldIdx = colCards.findIndex((c) => c.id === activeId)
        const newIdx = colCards.findIndex((c) => c.id === overId)
        if (oldIdx !== newIdx && newIdx >= 0) {
          setColumnMap((prev) => ({
            ...prev,
            [newColId]: arrayMove(colCards, oldIdx, newIdx),
          }))
        }
        return
      }

      // Cross-column move → optimistically update statusId on the card
      setCards((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, statusId: newColId } : c))
      )

      try {
        const res = await fetch(`/api/work-items/${activeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusId: newColId }),
        })
        if (!res.ok) throw new Error("Failed to update status")
      } catch {
        // Revert
        toast.error("Failed to move card — reverting")
        setCards((prev) =>
          prev.map((c) =>
            c.id === activeId ? { ...c, statusId: oldCard.statusId } : c
          )
        )
        setColumnMap((prev) => buildColumnMap(cards, columns))
      }
    },
    [cards, columnMap, columns, findColumn]
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.name}
            color={col.color}
            cards={columnMap[col.id] ?? []}
            projectId={projectId}
            addHref={`/projects/${projectId}/work-items/new`}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard ? <KanbanCardOverlay card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
