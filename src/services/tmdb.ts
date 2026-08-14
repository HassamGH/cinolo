import { tmdbGet, imageUrl } from './tmdbClient'
import type {
  RawCastMember,
  RawEpisode,
  RawMovie,
  RawPaged,
  RawSearchResult,
  RawSeason,
  RawTv,
} from './tmdbRaw'
import type {
  CastMember,
  Episode,
  MediaDetails,
  MediaSummary,
  MediaType,
  Season,
} from '../types/media'

const yearOf = (date: string | null | undefined) => (date ? date.slice(0, 4) : null)

function movieToSummary(m: RawMovie): MediaSummary {
  return {
    id: m.id,
    mediaType: 'movie',
    title: m.title,
    overview: m.overview,
    posterPath: m.poster_path,
    backdropPath: m.backdrop_path,
    year: yearOf(m.release_date),
    rating: m.vote_average ?? null,
  }
}

function tvToSummary(t: RawTv): MediaSummary {
  return {
    id: t.id,
    mediaType: 'tv',
    title: t.name,
    overview: t.overview,
    posterPath: t.poster_path,
    backdropPath: t.backdrop_path,
    year: yearOf(t.first_air_date),
    rating: t.vote_average ?? null,
  }
}

function searchResultToSummary(r: RawSearchResult): MediaSummary | null {
  if (r.media_type !== 'movie' && r.media_type !== 'tv') return null
  return {
    id: r.id,
    mediaType: r.media_type,
    title: (r.media_type === 'movie' ? r.title : r.name) ?? 'Untitled',
    overview: r.overview ?? '',
    posterPath: r.poster_path,
    backdropPath: r.backdrop_path,
    year: yearOf(r.media_type === 'movie' ? r.release_date : r.first_air_date),
    rating: r.vote_average ?? null,
  }
}

export interface DetailsExtra {
  runtimeMinutes: number | null
  numberOfSeasons?: number
}

function movieToDetails(m: RawMovie): MediaDetails {
  return {
    ...movieToSummary(m),
    genres: m.genres ?? [],
    runtimeMinutes: m.runtime ?? null,
    status: m.status ?? null,
    tagline: m.tagline || null,
  }
}

function tvToDetails(t: RawTv): MediaDetails {
  return {
    ...tvToSummary(t),
    genres: t.genres ?? [],
    runtimeMinutes: t.episode_run_time?.[0] ?? null,
    status: t.status ?? null,
    tagline: t.tagline || null,
    numberOfSeasons: t.number_of_seasons,
  }
}

// ---- Rows / browsing -------------------------------------------------

export async function getTrending(): Promise<MediaSummary[]> {
  const data = await tmdbGet<RawPaged<RawSearchResult>>('trending/all/week')
  return data.results.map(searchResultToSummary).filter((x): x is MediaSummary => x !== null)
}

export async function getPopularMovies(): Promise<MediaSummary[]> {
  const data = await tmdbGet<RawPaged<RawMovie>>('discover/movie', { sort_by: 'popularity.desc' })
  return data.results.map(movieToSummary)
}

export async function getPopularSeries(): Promise<MediaSummary[]> {
  const data = await tmdbGet<RawPaged<RawTv>>('discover/tv', { sort_by: 'popularity.desc' })
  return data.results.map(tvToSummary)
}

export async function getRecentlyAdded(): Promise<MediaSummary[]> {
  const today = new Date().toISOString().slice(0, 10)
  const [movies, tv] = await Promise.all([
    tmdbGet<RawPaged<RawMovie>>('discover/movie', {
      sort_by: 'primary_release_date.desc',
      'primary_release_date.lte': today,
      'vote_count.gte': 50,
    }),
    tmdbGet<RawPaged<RawTv>>('discover/tv', {
      sort_by: 'first_air_date.desc',
      'first_air_date.lte': today,
      'vote_count.gte': 50,
    }),
  ])
  const combined = [...movies.results.map(movieToSummary), ...tv.results.map(tvToSummary)]
  return combined.sort(() => Math.random() - 0.5).slice(0, 20)
}

export async function getRecommended(): Promise<MediaSummary[]> {
  const [movies, tv] = await Promise.all([
    tmdbGet<RawPaged<RawMovie>>('movie/top_rated'),
    tmdbGet<RawPaged<RawTv>>('tv/top_rated'),
  ])
  const combined = [...movies.results.map(movieToSummary), ...tv.results.map(tvToSummary)]
  return combined.sort(() => Math.random() - 0.5).slice(0, 20)
}

// ---- Related titles ---------------------------------------------------

export async function getRecommendedFor(id: number, mediaType: MediaType): Promise<MediaSummary[]> {
  if (mediaType === 'movie') {
    const data = await tmdbGet<RawPaged<RawMovie>>(`movie/${id}/recommendations`)
    return data.results.map(movieToSummary)
  }
  const data = await tmdbGet<RawPaged<RawTv>>(`tv/${id}/recommendations`)
  return data.results.map(tvToSummary)
}

// ---- Search ------------------------------------------------------------

export async function searchMoviesAndSeries(query: string): Promise<MediaSummary[]> {
  if (!query.trim()) return []
  const data = await tmdbGet<RawPaged<RawSearchResult>>('search/multi', { query })
  return data.results.map(searchResultToSummary).filter((x): x is MediaSummary => x !== null)
}

// ---- Details -------------------------------------------------------------

export async function getMovieDetails(id: number): Promise<MediaDetails> {
  const data = await tmdbGet<RawMovie>(`movie/${id}`)
  return movieToDetails(data)
}

export async function getSeriesDetails(id: number): Promise<MediaDetails> {
  const data = await tmdbGet<RawTv>(`tv/${id}`)
  return tvToDetails(data)
}

// ---- Seasons / episodes ---------------------------------------------------

export async function getSeriesSeasons(id: number): Promise<Season[]> {
  const data = await tmdbGet<RawTv>(`tv/${id}`)
  return (data.seasons ?? [])
    .filter((s: RawSeason) => s.season_number > 0)
    .map((s: RawSeason) => ({
      id: s.id,
      seasonNumber: s.season_number,
      name: s.name,
      episodeCount: s.episode_count,
      posterPath: s.poster_path,
    }))
}

export async function getEpisodes(seriesId: number, seasonNumber: number): Promise<Episode[]> {
  const data = await tmdbGet<{ episodes: RawEpisode[] }>(`tv/${seriesId}/season/${seasonNumber}`)
  return data.episodes.map((e) => ({
    id: e.id,
    episodeNumber: e.episode_number,
    seasonNumber: e.season_number,
    name: e.name,
    overview: e.overview,
    runtimeMinutes: e.runtime,
    stillPath: e.still_path,
    airDate: e.air_date,
  }))
}

// ---- Cast ------------------------------------------------------------------

export async function getCast(id: number, mediaType: MediaType): Promise<CastMember[]> {
  if (mediaType === 'movie') {
    const data = await tmdbGet<{ cast: RawCastMember[] }>(`movie/${id}/credits`)
    return data.cast.slice(0, 20).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character ?? '',
      profilePath: c.profile_path,
    }))
  }
  const data = await tmdbGet<{ cast: RawCastMember[] }>(`tv/${id}/aggregate_credits`)
  return data.cast.slice(0, 20).map((c) => ({
    id: c.id,
    name: c.name,
    character: c.roles?.[0]?.character ?? '',
    profilePath: c.profile_path,
  }))
}

export { imageUrl }
