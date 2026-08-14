export function CardSkeleton() {
  return (
    <div className="w-36 shrink-0 sm:w-44">
      <div className="aspect-2/3 animate-pulse rounded-lg bg-white/10" />
      <div className="mt-2 h-3.5 w-4/5 animate-pulse rounded bg-white/10" />
      <div className="mt-1.5 h-3 w-2/5 animate-pulse rounded bg-white/10" />
    </div>
  )
}

export function RowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden px-4 sm:gap-4 sm:px-8">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function HeroSkeleton() {
  return <div className="h-[68vh] w-full animate-pulse bg-white/10 sm:h-[82vh]" />
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function CastSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-white/10 bg-surface/40 p-3">
          <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-white/10" />
          <div className="min-w-0 flex-1">
            <div className="h-3.5 w-3/5 animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-3 w-2/5 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EpisodeSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-24 w-40 shrink-0 animate-pulse rounded-lg bg-white/10 sm:h-28 sm:w-48" />
          <div className="flex-1">
            <div className="h-3.5 w-1/3 animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-3 w-full animate-pulse rounded bg-white/10" />
            <div className="mt-1.5 h-3 w-4/5 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  )
}
