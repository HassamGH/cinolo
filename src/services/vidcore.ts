import type { PlayerSource } from '../types/media'

// Vidcore.io resolves a real playable stream from a TMDB id — no API key
// required, no metadata/search API of its own (that's what TMDB in ./tmdb.ts
// is for). Confirmed working path: vidcore.io/movie/{tmdbId} and
// vidcore.io/tv/{tmdbId}/{season}/{episode} — no /embed/ prefix, no query
// parameters recognized. Configure via VITE_VIDCORE_BASE_URL if it moves.
const VIDCORE_BASE_URL = import.meta.env.VITE_VIDCORE_BASE_URL || 'https://vidcore.io'

export function getVideoSource(source: PlayerSource): string {
  return source.type === 'movie'
    ? `${VIDCORE_BASE_URL}/movie/${source.id}`
    : `${VIDCORE_BASE_URL}/tv/${source.seriesId}/${source.season}/${source.episode}`
}
