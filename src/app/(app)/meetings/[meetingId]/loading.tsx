import { Skeleton } from "@/components/ui/skeleton"

export default function MeetingDetailLoading() {
  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-72" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="rounded-lg border p-5 space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="px-5 py-3 bg-muted/30">
          <Skeleton className="h-5 w-32" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-t px-5 py-3 flex gap-3 items-start">
            <Skeleton className="h-5 w-14 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-72" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
