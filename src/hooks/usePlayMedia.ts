import { useCallback, useState } from 'react'
import { getEpisodes, getSeriesSeasons } from '../services/tmdb'
import { useNavigation } from '../context/NavigationContext'
import { useLoadingBar } from '../context/LoadingBarContext'
import type { MediaSummary } from '../types/media'

/**
 * Centralizes "press play" logic. Movies play immediately. Series have no
 * season/episode chosen from a poster card, so we resolve season 1 / episode
 * 1 on demand (never prefetched for every row card, per the perf brief) and
 * then open the player.
 */
export function usePlayMedia() {
  const { openPlayer } = useNavigation()
  const { start, stop } = useLoadingBar()
  const [resolvingId, setResolvingId] = useState<number | null>(null)
  const [resolveError, setResolveError] = useState<string | null>(null)

  const playMovie = useCallback(
    (id: number, title: string) => {
      openPlayer({ type: 'movie', id, title })
    },
    [openPlayer]
  )

  const playSeriesFromStart = useCallback(
    async (id: number, title: string) => {
      setResolveError(null)
      setResolvingId(id)
      start()
      try {
        const seasons = await getSeriesSeasons(id)
        const target = seasons.find((s) => s.seasonNumber === 1) ?? seasons[0]
        if (!target) throw new Error('No playable seasons found')
        const episodes = await getEpisodes(id, target.seasonNumber)
        const first = episodes[0]
        if (!first) throw new Error('No episodes found for this season')
        openPlayer({
          type: 'episode',
          seriesId: id,
          seriesTitle: title,
          season: target.seasonNumber,
          episode: first.episodeNumber,
          episodeTitle: first.name,
        })
      } catch {
        setResolveError('Could not start this series right now.')
      } finally {
        setResolvingId(null)
        stop()
      }
    },
    [openPlayer, start, stop]
  )

  const play = useCallback(
    (item: MediaSummary) => {
      if (item.mediaType === 'movie') playMovie(item.id, item.title)
      else void playSeriesFromStart(item.id, item.title)
    },
    [playMovie, playSeriesFromStart]
  )

  return { play, playMovie, playSeriesFromStart, resolvingId, resolveError }
}
