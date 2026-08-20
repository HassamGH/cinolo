import { Play } from 'lucide-react'
import { imageUrl } from '../services/tmdb'
import { BackdropPlaceholder } from './ui/Placeholder'
import { formatRuntime } from '../utils/format'
import type { Episode } from '../types/media'

interface EpisodeListProps {
  episodes: Episode[] | null
  loading: boolean
  error: string | null
  onPlay: (episode: Episode) => void
}

export function EpisodeList({ episodes, loading, error, onPlay }: EpisodeListProps) {
  if (loading) return null
  if (error) return <p className="text-sm text-muted">Couldn't load episodes right now.</p>
  if (!episodes || episodes.length === 0) return <p className="text-sm text-muted">No episodes available yet.</p>

  return (
    <div className="scrollbar-thin mask-[linear-gradient(to_bottom,black_calc(100%-130px),transparent_100%)] flex max-h-160 flex-col gap-3 overflow-y-auto pr-2 [scrollbar-color:rgba(255,255,255,0.18)_transparent] sm:max-h-190 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:hover:bg-white/30 [&::-webkit-scrollbar-track]:bg-transparent">
      {episodes.map((ep) => {
        const still = imageUrl(ep.stillPath, 'w342')
        const runtime = formatRuntime(ep.runtimeMinutes)
        return (
          <button
            key={ep.id}
            type="button"
            onClick={() => onPlay(ep)}
            className="group flex cursor-pointer gap-4 rounded-lg p-2 text-left transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-lg bg-card sm:h-28 sm:w-48">
              {still ? (
                <img
                  src={still}
                  alt={ep.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <BackdropPlaceholder className="h-full w-full" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                <span className="flex h-10 w-10 items-center justify-center rounded bg-white text-black">
                  <Play size={16} className="ml-0.5" />
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-white">
                  {ep.episodeNumber}. {ep.name}
                </span>
              </div>
              {runtime && <p className="mt-0.5 text-xs text-muted">{runtime}</p>}
              <p className="mt-1.5 line-clamp-2 text-xs text-muted sm:text-sm">
                {ep.overview || 'No synopsis available.'}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
