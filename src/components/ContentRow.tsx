import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MediaCard } from './MediaCard'
import { RowSkeleton } from './ui/Skeletons'
import type { MediaSummary } from '../types/media'

interface ContentRowProps {
  title: string
  items: MediaSummary[] | null
  error?: string | null
  onSelect: (item: MediaSummary) => void
}

export function ContentRow({ title, items, error, onSelect }: ContentRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  const scrollBy = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * scrollerRef.current.clientWidth * 0.9, behavior: 'smooth' })
  }

  if (error) {
    return (
      <section>
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
          <h2 className="mb-3 text-lg font-semibold text-white sm:text-xl">{title}</h2>
          <p className="text-sm text-muted">Couldn't load this row right now.</p>
        </div>
      </section>
    )
  }

  if (!items) {
    return (
      <section>
        <h2 className="mx-auto mb-3 max-w-[1600px] px-4 text-lg font-semibold text-white sm:px-8 sm:text-xl">
          {title}
        </h2>
        <RowSkeleton />
      </section>
    )
  }

  if (items.length === 0) return null

  return (
    <section className="group/row">
      <div className="relative mx-auto max-w-[1600px]">
        <h2 className="mb-3 px-4 text-lg font-semibold text-white sm:px-8 sm:text-xl">{title}</h2>

        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollBy(-1)}
          className="absolute top-1/2 left-0 z-10 hidden h-20 w-10 -translate-y-1/2 cursor-pointer items-center justify-center bg-linear-to-r from-background to-transparent text-white opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:flex"
        >
          <ChevronLeft size={28} />
        </button>

        <div
          ref={scrollerRef}
          className="scrollbar-none flex gap-3 overflow-x-auto scroll-smooth px-4 pb-2 sm:gap-4 sm:px-8"
        >
          {items.map((item) => (
            <MediaCard key={`${item.mediaType}-${item.id}`} item={item} onSelect={onSelect} />
          ))}
        </div>

        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollBy(1)}
          className="absolute top-1/2 right-0 z-10 hidden h-20 w-10 -translate-y-1/2 cursor-pointer items-center justify-center bg-linear-to-l from-background to-transparent text-white opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:flex"
        >
          <ChevronRight size={28} />
        </button>
      </div>
    </section>
  )
}
