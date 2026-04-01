"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"
import { useDebouncedCallback } from "use-debounce"

const TYPES = ["TASK", "BUG", "FEATURE", "ENQUIRY", "NOTE", "FOLLOW_UP", "DECISION"]
const TYPE_LABELS: Record<string, string> = {
  TASK: "Task",
  BUG: "Bug",
  FEATURE: "Feature",
  ENQUIRY: "Enquiry",
  NOTE: "Note",
  FOLLOW_UP: "Follow-up",
  DECISION: "Decision",
}
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
}

interface Props {
  defaultQ?: string
  defaultType?: string
  defaultPriority?: string
}

export function ItemsFilterBar({ defaultQ, defaultType, defaultPriority }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== "ALL") {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.replace(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const handleSearch = useDebouncedCallback((value: string) => {
    updateParam("q", value || undefined)
  }, 300)

  return (
    <div className="flex gap-3 flex-wrap">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search work items..."
          defaultValue={defaultQ}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select defaultValue={defaultType ?? "ALL"} onValueChange={(v) => updateParam("type", v)}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All types</SelectItem>
          {TYPES.map((t) => (
            <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue={defaultPriority ?? "ALL"} onValueChange={(v) => updateParam("priority", v)}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="All priorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All priorities</SelectItem>
          {PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
