import { Skeleton } from "@/components/ui/skeleton"

export default function BoardLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border p-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-24 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, col) => (
          <div key={col} className="shrink-0 w-72 space-y-3">
            <div className="flex items-center justify-between px-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-6" />
            </div>
            <div className="rounded-lg bg-muted/30 p-2 space-y-2 min-h-[200px]">
              {Array.from({ length: col === 0 ? 4 : col === 1 ? 3 : 2 }).map((_, card) => (
                <div key={card} className="rounded-md bg-background border p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-1">
                      <Skeleton className="h-4 w-12 rounded-sm" />
                      <Skeleton className="h-4 w-10 rounded-sm" />
                    </div>
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
