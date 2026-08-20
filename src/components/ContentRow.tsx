import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MediaCard } from './MediaCard'
import type { MediaSummary } from '../types/media'

interface ContentRowProps {
  title: string
  items: MediaSummary[] | null
  error?: string | null
  onRetry?: () => void
  onSelect: (item: MediaSummary) => void
}

// Distance a mouse-down has to travel before a press counts as a drag
// rather than a click — keeps a plain click on a card still opening it.
const DRAG_THRESHOLD_PX = 5

export function ContentRow({ title, items, error, onRetry, onSelect }: ContentRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  // Mutable drag bookkeeping doesn't need to trigger renders itself — only
  // isDragging (for the cursor) does.
  const dragRef = useRef<{ startX: number; startScrollLeft: number; pointerId: number; moved: boolean } | null>(null)

  const scrollBy = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * scrollerRef.current.clientWidth * 0.9, behavior: 'smooth' })
  }

  // Click-and-drag horizontal scroll for mouse users — touch/pen already
  // scroll natively via the browser, so this only engages for pointerType
  // "mouse" and leaves everything else alone. Pointer capture is only
  // acquired once real movement crosses the threshold, not on every
  // pointerdown — capturing on the scroller for a plain click redirects
  // the resulting click event's target to the capturing element in
  // Chromium, which silently swallows clicks on cards.
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !scrollerRef.current) return
    dragRef.current = {
      startX: e.clientX,
      startScrollLeft: scrollerRef.current.scrollLeft,
      pointerId: e.pointerId,
      moved: false,
    }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const scroller = scrollerRef.current
    if (!drag || !scroller) return
    const delta = e.clientX - drag.startX
    if (!drag.moved && Math.abs(delta) > DRAG_THRESHOLD_PX) {
      drag.moved = true
      scroller.setPointerCapture(drag.pointerId)
      setIsDragging(true)
    }
    if (drag.moved) scroller.scrollLeft = drag.startScrollLeft - delta
  }

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    if (drag.moved) scrollerRef.current?.releasePointerCapture(e.pointerId)
    setIsDragging(false)
  }

  // Runs in the capture phase, before the click reaches a MediaCard's own
  // handler — swallows the click that would otherwise fire when a drag
  // ends, so dragging past a card doesn't also open it.
  const onClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (dragRef.current?.moved) {
      e.stopPropagation()
      e.preventDefault()
    }
    dragRef.current = null
  }

  if (error) {
    return (
      <section>
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
          <h2 className="mb-3 text-lg font-semibold text-white sm:text-xl">{title}</h2>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span>Couldn't load this row.</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="cursor-pointer font-medium text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </section>
    )
  }

  if (!items) return null

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
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
          className={`scrollbar-none flex gap-3 overflow-x-auto px-4 pb-2 select-none sm:gap-4 sm:px-8 ${
            isDragging ? 'cursor-grabbing scroll-auto' : 'cursor-grab scroll-smooth'
          }`}
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
