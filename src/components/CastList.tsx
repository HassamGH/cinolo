import { User } from 'lucide-react'
import { useAsyncData } from '../hooks/useAsyncData'
import { getCast, imageUrl } from '../services/tmdb'
import { CastSkeleton } from './ui/Skeletons'
import type { MediaType } from '../types/media'

export function CastList({ id, mediaType }: { id: number; mediaType: MediaType }) {
  const { data: cast, loading, error } = useAsyncData(() => getCast(id, mediaType), [id, mediaType])

  return (
    <section className="mt-10">
      <h2 className="mb-4 flex items-center gap-3 text-xl font-semibold text-white">
        <span className="h-5 w-1 shrink-0 rounded-full bg-accent" />
        Actors
      </h2>

      {loading && <CastSkeleton />}

      {error && <p className="text-sm text-muted">Couldn't load cast right now.</p>}

      {!loading && !error && cast && cast.length === 0 && (
        <p className="text-sm text-muted">No cast information available.</p>
      )}

      {!loading && cast && cast.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cast.map((member) => {
            const photo = imageUrl(member.profilePath, 'w185')
            return (
              <div
                key={member.id}
                className="group flex items-center gap-3 rounded-lg border border-white/10 bg-surface/40 p-3 transition-colors hover:border-accent hover:bg-surface/70"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-card">
                  {photo ? (
                    <img
                      src={photo}
                      alt={member.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted/40">
                      <User size={22} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white transition-colors group-hover:text-accent">
                    {member.name}
                  </p>
                  {member.character && <p className="truncate text-xs text-muted">{member.character}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
