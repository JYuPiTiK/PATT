import { Skeleton } from "@/components/ui/skeleton"

export default function ListLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 flex-1 max-w-sm" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="bg-muted/50 px-4 py-2.5 flex gap-4">
          {[200, 80, 80, 100, 80, 60].map((w, i) => (
            <Skeleton key={i} className="h-4" style={{ width: w }} />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="border-t px-4 py-3 flex gap-4 items-center">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-56" />
              <div className="flex gap-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-16 rounded-sm" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}
