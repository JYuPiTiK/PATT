"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface ProjectSearchProps {
  defaultValue?: string
}

export function ProjectSearch({ defaultValue }: ProjectSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (term) {
      params.set("search", term)
    } else {
      params.delete("search")
    }
    router.replace(`/projects?${params.toString()}`)
  }, 300)

  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search projects..."
        defaultValue={defaultValue}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-9"
      />
    </div>
  )
}
