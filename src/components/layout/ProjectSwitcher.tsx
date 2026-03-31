"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown, FolderKanban } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

interface Project {
  id: string
  name: string
  color: string
}

interface ProjectSwitcherProps {
  projects: Project[]
  currentProjectId?: string
}

export function ProjectSwitcher({ projects, currentProjectId }: ProjectSwitcherProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)

  const current = projects.find((p) => p.id === currentProjectId)
  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-between max-w-48 truncate">
          <span className="flex items-center gap-2 truncate">
            {current ? (
              <>
                <span
                  className="h-3 w-3 rounded-sm shrink-0"
                  style={{ backgroundColor: current.color }}
                />
                <span className="truncate">{current.name}</span>
              </>
            ) : (
              <>
                <FolderKanban className="h-3 w-3" />
                <span>Select project</span>
              </>
            )}
          </span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <div className="p-2">
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-64 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-2 py-4 text-center text-xs text-muted-foreground">No projects found</div>
          )}
          {filtered.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onSelect={() => {
                router.push(`/projects/${project.id}`)
                setOpen(false)
                setSearch("")
              }}
              className="cursor-pointer"
            >
              <span
                className="mr-2 h-3 w-3 rounded-sm shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <span className="truncate">{project.name}</span>
              {project.id === currentProjectId && <Check className="ml-auto h-3 w-3" />}
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => { router.push("/projects/new"); setOpen(false) }}
          className="cursor-pointer text-sm"
        >
          + New project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
