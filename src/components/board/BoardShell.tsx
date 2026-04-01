"use client"

import { useState } from "react"
import { KanbanBoard } from "./KanbanBoard"
import { GroupedBoard } from "./GroupedBoard"
import { type BoardCard } from "./KanbanCard"

type ViewMode = "board" | "type" | "version"

interface StatusColumn {
  id: string
  name: string
  color: string
}

interface BoardShellProps {
  projectId: string
  columns: StatusColumn[]
  cards: BoardCard[]
  versions: { id: string; name: string }[]
}

const VIEW_TABS: { id: ViewMode; label: string }[] = [
  { id: "board", label: "By Status" },
  { id: "type", label: "By Type" },
  { id: "version", label: "By Version" },
]

export function BoardShell({ projectId, columns, cards, versions }: BoardShellProps) {
  const [view, setView] = useState<ViewMode>("board")

  const statusMap = Object.fromEntries(columns.map((c) => [c.id, c.name]))

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* View toggle */}
      <div className="flex items-center gap-1 border rounded-md p-0.5 w-fit bg-muted/30">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              view === tab.id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Board */}
      <div className="flex-1 overflow-auto">
        {view === "board" && (
          <KanbanBoard
            projectId={projectId}
            initialColumns={columns}
            initialCards={cards}
          />
        )}
        {(view === "type" || view === "version") && (
          <GroupedBoard
            cards={cards}
            groupBy={view}
            statusMap={statusMap}
            versions={versions}
          />
        )}
      </div>
    </div>
  )
}
