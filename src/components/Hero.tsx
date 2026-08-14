import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { Info, Play } from 'lucide-react'
import { getMovieDetails, getSeriesDetails, imageUrl } from '../services/tmdb'
import { usePlayMedia } from '../hooks/usePlayMedia'
import { formatMetaLine, formatRuntime } from '../utils/format'
import { HeroSkeleton } from './ui/Skeletons'
import { BACKDROP_GRADIENT_CLASS } from '../utils/styleConstants'
import type { MediaDetails, MediaSummary } from '../types/media'

interface HeroProps {
  candidates: MediaSummary[] | null
  onSelect: (item: MediaSummary) => void
}

const SLIDE_COUNT = 6
const AUTO_ADVANCE_MS = 7000

export function Hero({ candidates, onSelect }: HeroProps) {
  const slides = candidates?.slice(0, SLIDE_COUNT) ?? []
  const [index, setIndex] = useState(0)
  const [details, setDetails] = useState<MediaDetails | null>(null)
  const [paused, setPaused] = useState(false)
  const { play, resolvingId } = usePlayMedia()
  const dragStartX = useRef<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const active = slides[index] ?? null

  const goTo = useCallback(
    (i: number) => {
      if (slides.length === 0) return
      setIndex(((i % slides.length) + slides.length) % slides.length)
    },
    [slides.length]
  )

  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])

  useEffect(() => {
    setIndex(0)
  }, [candidates])

  useEffect(() => {
    if (!active) return
    let cancelled = false
    setDetails(null)
    const load = active.mediaType === 'movie' ? getMovieDetails(active.id) : getSeriesDetails(active.id)
    load
      .then((d) => {
        if (!cancelled) setDetails(d)
      })
      .catch(() => {
        if (!cancelled) setDetails(null)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, active?.mediaType])

  useEffect(() => {
    if (slides.length <= 1 || paused) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [slides.length, paused])

  if (!candidates) return <HeroSkeleton />
  if (!active) return null

  const backdrop = imageUrl(active.backdropPath, 'original')
  const meta = formatMetaLine([
    active.year,
    details ? formatRuntime(details.runtimeMinutes) : null,
    ...(details?.genres.slice(0, 3).map((g) => g.name) ?? []),
  ])
  const slideKey = `${active.mediaType}-${active.id}`

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    // Let real controls (Play, More Info, dot indicators) work normally —
    // only start a drag gesture when the press starts on plain picture/text.
    if ((e.target as HTMLElement).closest('button, a')) return
    dragStartX.current = e.clientX
    setIsDragging(true)
    setPaused(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    if (dragStartX.current !== null) {
      const delta = e.clientX - dragStartX.current
      if (Math.abs(delta) > 60) (delta > 0 ? prev() : next())
    }
    dragStartX.current = null
    setIsDragging(false)
    setPaused(false)
  }
  const onPointerCancel = () => {
    dragStartX.current = null
    setIsDragging(false)
    setPaused(false)
  }

  return (
    <section
      className={`relative h-[68vh] min-h-[420px] w-full touch-pan-y overflow-hidden select-none sm:h-[86vh] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div className="absolute inset-0">
        {backdrop ? (
          <img
            key={slideKey}
            src={backdrop}
            alt=""
            draggable={false}
            className="h-full w-full object-cover object-top select-none"
            fetchPriority="high"
          />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-[#141414] to-background" />
        )}
        <div className={`absolute inset-0 ${BACKDROP_GRADIENT_CLASS}`} />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col justify-end px-4 pb-16 sm:px-8 sm:pb-24">
        <div key={slideKey} className="max-w-2xl">
          <h1 className="text-3xl leading-tight font-extrabold text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
            {active.title}
          </h1>
          {meta && <p className="mt-3 text-sm font-medium text-white/80 sm:text-base">{meta}</p>}
          {active.overview && (
            <p className="mt-4 line-clamp-3 max-w-xl text-sm text-white/70 sm:text-base">{active.overview}</p>
          )}

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => play(active)}
              disabled={resolvingId === active.id}
              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Play size={16} className="fill-black" />
              Play
            </button>
            <button
              type="button"
              onClick={() => onSelect(active)}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition-transform hover:scale-105 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95"
            >
              <Info size={16} />
              More Info
            </button>
          </div>
        </div>

        {slides.length > 1 && (
          <div className="mt-8 flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={`${s.mediaType}-${s.id}`}
                type="button"
                aria-label={`Show slide ${i + 1}: ${s.title}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  i === index ? 'w-8 bg-accent' : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
