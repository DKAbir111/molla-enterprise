import { Skeleton } from '@/components/ui/skeleton'

/** Route-level loading UI, shown while a locale page streams in. */
export default function LocaleLoading() {
  return (
    <div className="w-full space-y-6 p-2" role="status" aria-label="Loading page">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}
