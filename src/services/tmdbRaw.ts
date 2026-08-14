// Minimal shapes for the fields of the TMDB v3 API responses that Zeno
// actually reads. TMDB returns far more than this; we only type what we use.

export interface RawGenre {
  id: number
  name: string
}

export interface RawMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string | null
  vote_average: number | null
  genres?: RawGenre[]
  runtime?: number | null
  status?: string | null
  tagline?: string | null
}

export interface RawTv {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string | null
  vote_average: number | null
  genres?: RawGenre[]
  episode_run_time?: number[]
  status?: string | null
  tagline?: string | null
  number_of_seasons?: number
  seasons?: RawSeason[]
}

export interface RawSeason {
  id: number
  season_number: number
  name: string
  episode_count: number
  poster_path: string | null
}

export interface RawEpisode {
  id: number
  episode_number: number
  season_number: number
  name: string
  overview: string
  runtime: number | null
  still_path: string | null
  air_date: string | null
}

export interface RawCastMember {
  id: number
  name: string
  character?: string
  roles?: { character: string }[]
  profile_path: string | null
  order?: number
}

export interface RawSearchResult {
  id: number
  media_type: 'movie' | 'tv' | 'person'
  title?: string
  name?: string
  overview?: string
  poster_path: string | null
  backdrop_path: string | null
  release_date?: string | null
  first_air_date?: string | null
  vote_average?: number | null
}

export interface RawPaged<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}
