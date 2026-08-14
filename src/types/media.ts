export type MediaType = 'movie' | 'tv'

export interface MediaSummary {
  id: number
  mediaType: MediaType
  title: string
  overview: string
  posterPath: string | null
  backdropPath: string | null
  year: string | null
  rating: number | null
}

export interface Genre {
  id: number
  name: string
}

export interface MediaDetails extends MediaSummary {
  genres: Genre[]
  runtimeMinutes: number | null
  status: string | null
  tagline: string | null
  numberOfSeasons?: number
}

export interface CastMember {
  id: number
  name: string
  character: string
  profilePath: string | null
}

export interface Season {
  id: number
  seasonNumber: number
  name: string
  episodeCount: number
  posterPath: string | null
}

export interface Episode {
  id: number
  episodeNumber: number
  seasonNumber: number
  name: string
  overview: string
  runtimeMinutes: number | null
  stillPath: string | null
  airDate: string | null
}

export type PlayerSource =
  | { type: 'movie'; id: number; title: string }
  | { type: 'episode'; seriesId: number; seriesTitle: string; season: number; episode: number; episodeTitle: string }
