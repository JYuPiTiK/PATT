import { Skeleton } from "@/components/ui/skeleton"

export default function WorkItemDetailLoading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      {/* Main content */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <Skeleton className="h-5 w-24" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <div className="rounded-lg border p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
