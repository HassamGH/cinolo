import { Info, Play } from 'lucide-react'
import { imageUrl } from '../services/tmdb'
import { PosterPlaceholder } from './ui/Placeholder'
import { RatingBadge } from './ui/RatingBadge'
import type { MediaSummary } from '../types/media'

interface SearchResultItemProps {
  item: MediaSummary
  onPlay: (item: MediaSummary) => void
  onSeeMore: (item: MediaSummary) => void
  playLoading?: boolean
}

export function SearchResultItem({ item, onPlay, onSeeMore, playLoading = false }: SearchResultItemProps) {
  const poster = imageUrl(item.posterPath, 'w185')

  return (
    <div className="flex gap-4 rounded-xl p-2 transition-colors hover:bg-surface sm:p-3">
      <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-card sm:h-28 sm:w-20">
        {poster ? (
          <img src={poster} alt={item.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <PosterPlaceholder className="h-full w-full" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white">{item.title}</p>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted sm:text-sm">
          {item.year && <span>{item.year}</span>}
          <span>·</span>
          <span>{item.mediaType === 'movie' ? 'Movie' : 'TV Series'}</span>
          <RatingBadge rating={item.rating} />
        </p>
        {item.overview && <p className="mt-1.5 line-clamp-2 hidden text-xs text-muted sm:block">{item.overview}</p>}

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPlay(item)}
            disabled={playLoading}
            aria-label={`Play ${item.title}`}
            className="flex cursor-pointer items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-black transition-transform hover:scale-105 focus-visible:outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Play size={12} className="fill-black" />
            Play
          </button>
          <button
            type="button"
            onClick={() => onSeeMore(item)}
            className="flex cursor-pointer items-center gap-1 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none"
          >
            <Info size={12} />
            See More
          </button>
        </div>
      </div>
    </div>
  )
}
