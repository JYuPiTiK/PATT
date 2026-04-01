import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectMeetingsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-muted/50 px-4 py-2.5 flex gap-4">
          {[160, 80, 100, 60, 80].map((w, i) => (
            <Skeleton key={i} className="h-4" style={{ width: w }} />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-t px-4 py-3 flex gap-4 items-center">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
