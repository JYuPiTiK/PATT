import { Skeleton } from "@/components/ui/skeleton"

export default function SearchLoading() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-40" />
      </div>

      {Array.from({ length: 2 }).map((_, i) => (
        <section key={i} className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="rounded-lg border divide-y">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-start gap-3 px-4 py-3">
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-80" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
