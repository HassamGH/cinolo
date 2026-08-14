import { List, Play, Sparkles } from 'lucide-react'
import { imageUrl } from '../services/tmdb'
import { BackdropPlaceholder } from './ui/Placeholder'
import { RatingBadge } from './ui/RatingBadge'
import { formatMetaLine, formatRuntime } from '../utils/format'
import { BACKDROP_GRADIENT_CLASS } from '../utils/styleConstants'
import type { MediaDetails } from '../types/media'

interface DetailHeaderProps {
  details: MediaDetails
  onPlay: () => void
  playLoading?: boolean
}

export function DetailHeader({ details, onPlay, playLoading = false }: DetailHeaderProps) {
  const backdrop = imageUrl(details.backdropPath, 'original')

  const meta = formatMetaLine([
    details.year,
    details.mediaType === 'movie' ? formatRuntime(details.runtimeMinutes) : null,
    ...details.genres.slice(0, 4).map((g) => g.name),
  ])

  return (
    <div className="relative h-[52vh] min-h-95 w-full sm:h-[70vh]">
      <div className="absolute inset-0">
        {backdrop ? (
          <img src={backdrop} alt="" className="h-full w-full object-cover object-top" />
        ) : (
          <BackdropPlaceholder className="h-full w-full" />
        )}
        <div className={`absolute inset-0 ${BACKDROP_GRADIENT_CLASS}`} />
      </div>

      <div className="relative z-10 mx-auto h-full max-w-[1600px]">
        <div className="flex h-full flex-col justify-end px-4 pb-10 sm:px-8 sm:pb-14">
          <div className="max-w-4xl">
            <h1 className="text-3xl leading-tight font-extrabold tracking-wide text-white uppercase drop-shadow-lg sm:text-5xl lg:text-6xl">
              {details.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/80 sm:text-base">
              <RatingBadge rating={details.rating} />
              {meta && (
                <span>
                  {details.rating && details.rating > 0 ? '· ' : ''}
                  {meta}
                </span>
              )}
            </div>

            {details.overview && (
              <p className="mt-4 max-w-2xl text-sm text-white/75 sm:text-base">{details.overview}</p>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={onPlay}
                disabled={playLoading}
                className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Play size={16} className="fill-black" />
                Play
              </button>
              {details.mediaType === 'tv' && (
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById('episodes-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition-transform hover:scale-105 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95"
                >
                  <List size={16} />
                  Episodes
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  document.getElementById('similar-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition-transform hover:scale-105 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95"
              >
                <Sparkles size={16} />
                Similar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
