import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectSettingsLoading() {
  return (
    <div className="space-y-8 max-w-2xl">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-64" />
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      ))}
    </div>
  )
}
