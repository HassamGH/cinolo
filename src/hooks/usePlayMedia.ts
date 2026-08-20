import { useCallback, useState } from 'react'
import { getEpisodes, getSeriesSeasons } from '../services/tmdb'
import { useNavigation } from '../context/NavigationContext'
import { useLoadingBar } from '../context/LoadingBarContext'
import { useContinueWatching } from '../context/ContinueWatchingContext'
import type { MediaSummary } from '../types/media'

interface PlayableMovie {
  id: number
  title: string
  posterPath: string | null
  backdropPath: string | null
}

interface PlayableSeries {
  id: number
  title: string
  posterPath: string | null
  backdropPath: string | null
}

// Only what playEpisode actually needs — narrower than the full Episode type
// so a stored Continue Watching entry (season/episode/title only, no TMDB
// episode id) can be replayed through the same path as a real Episode.
interface EpisodeLike {
  seasonNumber: number
  episodeNumber: number
  name: string
}

/**
 * Centralizes "press play" logic. Movies play immediately. Series have no
 * season/episode chosen from a poster card, so we resolve season 1 / episode
 * 1 on demand (never prefetched for every row card, per the perf brief) and
 * then open the player. Every successful play is also recorded to Continue
 * Watching (see context/ContinueWatchingContext.tsx) — Vidcore exposes no
 * progress signal, so this only remembers *which* title/episode was opened.
 */
export function usePlayMedia() {
  const { openPlayer } = useNavigation()
  const { items: continueWatchingItems, record } = useContinueWatching()
  const { start, stop } = useLoadingBar()
  const [resolvingId, setResolvingId] = useState<number | null>(null)
  const [resolveError, setResolveError] = useState<string | null>(null)

  const playMovie = useCallback(
    (movie: PlayableMovie) => {
      openPlayer({ type: 'movie', id: movie.id, title: movie.title })
      record({
        key: `movie:${movie.id}`,
        mediaType: 'movie',
        id: movie.id,
        title: movie.title,
        posterPath: movie.posterPath,
        backdropPath: movie.backdropPath,
      })
    },
    [openPlayer, record]
  )

  const playEpisode = useCallback(
    (series: PlayableSeries, episode: EpisodeLike) => {
      openPlayer({
        type: 'episode',
        seriesId: series.id,
        seriesTitle: series.title,
        season: episode.seasonNumber,
        episode: episode.episodeNumber,
        episodeTitle: episode.name,
      })
      record({
        key: `tv:${series.id}`,
        mediaType: 'tv',
        id: series.id,
        title: series.title,
        posterPath: series.posterPath,
        backdropPath: series.backdropPath,
        season: episode.seasonNumber,
        episode: episode.episodeNumber,
        episodeTitle: episode.name,
      })
    },
    [openPlayer, record]
  )

  const playSeriesFromStart = useCallback(
    async (series: PlayableSeries) => {
      setResolveError(null)
      setResolvingId(series.id)
      start()
      try {
        const seasons = await getSeriesSeasons(series.id)
        const target = seasons.find((s) => s.seasonNumber === 1) ?? seasons[0]
        if (!target) throw new Error('No playable seasons found')
        const episodes = await getEpisodes(series.id, target.seasonNumber)
        const first = episodes[0]
        if (!first) throw new Error('No episodes found for this season')
        playEpisode(series, first)
      } catch {
        setResolveError('Could not start this series right now.')
      } finally {
        setResolvingId(null)
        stop()
      }
    },
    [playEpisode, start, stop]
  )

  const isResuming = useCallback(
    (item: MediaSummary) => continueWatchingItems.some((entry) => entry.key === `${item.mediaType}:${item.id}`),
    [continueWatchingItems]
  )

  // Resume-aware: a series with a Continue Watching entry jumps back to that
  // exact episode instead of restarting at S1E1 (movies have nothing to
  // resume to — same play call either way).
  const play = useCallback(
    (item: MediaSummary) => {
      if (item.mediaType === 'movie') {
        playMovie(item)
        return
      }
      const existing = continueWatchingItems.find((entry) => entry.key === `tv:${item.id}`)
      if (existing) {
        playEpisode(item, {
          seasonNumber: existing.season ?? 1,
          episodeNumber: existing.episode ?? 1,
          name: existing.episodeTitle ?? '',
        })
        return
      }
      void playSeriesFromStart(item)
    },
    [playMovie, playEpisode, playSeriesFromStart, continueWatchingItems]
  )

  return { play, playMovie, playEpisode, playSeriesFromStart, isResuming, resolvingId, resolveError }
}
