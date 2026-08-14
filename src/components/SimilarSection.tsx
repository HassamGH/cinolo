import { useAsyncData } from '../hooks/useAsyncData'
import { getRecommendedFor } from '../services/tmdb'
import { MediaCard } from './MediaCard'
import { GridSkeleton } from './ui/Skeletons'
import type { MediaSummary, MediaType } from '../types/media'

interface SimilarSectionProps {
  id: number
  mediaType: MediaType
  onSelect: (item: MediaSummary) => void
}

export function SimilarSection({ id, mediaType, onSelect }: SimilarSectionProps) {
  const { data, loading, error } = useAsyncData(() => getRecommendedFor(id, mediaType), [id, mediaType])

  if (error) return null
  if (!loading && data && data.length === 0) return null

  return (
    <section id="similar-section" className="mt-10 scroll-mt-24">
      <h2 className="mb-4 flex items-center gap-3 text-xl font-semibold text-white">
        <span className="h-5 w-1 shrink-0 rounded-full bg-accent" />
        You may like
      </h2>

      {loading && <GridSkeleton />}

      {!loading && data && data.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {data.slice(0, 18).map((item) => (
            <MediaCard key={`${item.mediaType}-${item.id}`} item={item} onSelect={onSelect} />
          ))}
        </div>
      )}
    </section>
  )
}
