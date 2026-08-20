import { imageUrl } from '../services/tmdb'
import { PosterPlaceholder } from './ui/Placeholder'
import { RatingBadge } from './ui/RatingBadge'
import type { MediaSummary } from '../types/media'

interface MediaCardProps {
  item: MediaSummary
  onSelect: (item: MediaSummary) => void
  className?: string
}

export function MediaCard({ item, onSelect, className = '' }: MediaCardProps) {
  const poster = imageUrl(item.posterPath, 'w342')

  const onCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(item)
    }
  }

  return (
    <div className={`group shrink-0 ${className || 'w-36 sm:w-44'}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(item)}
        onKeyDown={onCardKeyDown}
        aria-label={`View details for ${item.title}`}
        className="relative block aspect-2/3 w-full cursor-pointer overflow-hidden rounded-lg bg-card shadow-lg shadow-black/40 transition-transform duration-300 ease-out will-change-transform hover:scale-105 hover:shadow-2xl hover:shadow-black/60 focus-visible:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {poster ? (
          <img
            src={poster}
            alt={item.title}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-full w-full object-cover"
          />
        ) : (
          <PosterPlaceholder className="h-full w-full" />
        )}

        <span className="absolute top-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
          {item.mediaType === 'movie' ? 'Movie' : 'TV'}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onSelect(item)}
        className="mt-2 block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <p className="truncate text-sm font-medium text-white">{item.title}</p>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
          {item.year && <span>{item.year}</span>}
          <RatingBadge rating={item.rating} />
        </p>
      </button>
    </div>
  )
}
