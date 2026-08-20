import { useEffect } from 'react'
import { useAsyncData } from '../hooks/useAsyncData'
import { useLoadingBar } from '../context/LoadingBarContext'
import { getRecommendedFor } from '../services/tmdb'
import { MediaCard } from './MediaCard'
import type { MediaSummary, MediaType } from '../types/media'

interface SimilarSectionProps {
  id: number
  mediaType: MediaType
  onSelect: (item: MediaSummary) => void
}

export function SimilarSection({ id, mediaType, onSelect }: SimilarSectionProps) {
  const { data, loading, error } = useAsyncData(() => getRecommendedFor(id, mediaType), [id, mediaType])
  const { start, stop } = useLoadingBar()

  useEffect(() => {
    if (!loading) return
    start()
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  if (loading || error) return null
  if (data && data.length === 0) return null

  return (
    <section id="similar-section" className="mt-10 scroll-mt-24">
      <h2 className="mb-4 flex items-center gap-3 text-xl font-semibold text-white">
        <span className="h-5 w-1 shrink-0 rounded-full bg-accent" />
        You may like
      </h2>

      {data && data.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
          {data.slice(0, 18).map((item) => (
            <MediaCard key={`${item.mediaType}-${item.id}`} item={item} onSelect={onSelect} className="w-full" />
          ))}
        </div>
      )}
    </section>
  )
}
