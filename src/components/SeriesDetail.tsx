import { useEffect, useMemo, useState } from 'react'
import { ArrowUpDown, Search } from 'lucide-react'
import { useNavigation } from '../context/NavigationContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { usePlayMedia } from '../hooks/usePlayMedia'
import { useLoadingBar } from '../context/LoadingBarContext'
import { useAppReady } from '../context/AppReadyContext'
import { useReportOffline } from '../context/OfflineContext'
import { useContinueWatching } from '../context/ContinueWatchingContext'
import { getEpisodes, getSeriesDetails, getSeriesSeasons } from '../services/tmdb'
import { DetailHeader } from './DetailHeader'
import { SeasonSelector } from './SeasonSelector'
import { EpisodeList } from './EpisodeList'
import { CastList } from './CastList'
import { SimilarSection } from './SimilarSection'
import { ApiErrorPage } from './ui/ApiErrorPage'
import type { Episode } from '../types/media'

export function SeriesDetail({ id }: { id: number }) {
  const { openMovie, openSeries } = useNavigation()
  const { playEpisode, playSeriesFromStart, resolvingId } = usePlayMedia()
  const { start, stop } = useLoadingBar()
  const { markReady } = useAppReady()
  const { items: continueWatchingItems } = useContinueWatching()
  const continueItem = continueWatchingItems.find((item) => item.key === `tv:${id}`)

  const { data: details, loading, error, retry } = useAsyncData(() => getSeriesDetails(id), [id])
  const { data: seasons } = useAsyncData(() => getSeriesSeasons(id), [id])

  useEffect(() => {
    if (!loading) {
      markReady()
      return
    }
    start()
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [episodeQuery, setEpisodeQuery] = useState('')
  const [sortDesc, setSortDesc] = useState(false)

  useEffect(() => {
    if (seasons && seasons.length > 0 && selectedSeason === null) {
      setSelectedSeason(seasons.find((s) => s.seasonNumber === 1)?.seasonNumber ?? seasons[0].seasonNumber)
    }
  }, [seasons, selectedSeason])

  useEffect(() => {
    setEpisodeQuery('')
  }, [selectedSeason])

  const {
    data: episodes,
    loading: episodesLoading,
    error: episodesError,
  } = useAsyncData(
    () => (selectedSeason !== null ? getEpisodes(id, selectedSeason) : Promise.resolve<Episode[]>([])),
    [id, selectedSeason]
  )

  useEffect(() => {
    if (!episodesLoading) return
    start()
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodesLoading])

  const visibleEpisodes = useMemo(() => {
    if (!episodes) return episodes
    const query = episodeQuery.trim().toLowerCase()
    const filtered = query
      ? episodes.filter(
          (ep) => ep.name.toLowerCase().includes(query) || ep.overview.toLowerCase().includes(query)
        )
      : episodes
    return sortDesc ? [...filtered].reverse() : filtered
  }, [episodes, episodeQuery, sortDesc])

  useReportOffline(!loading && (Boolean(error) || !details))

  if (loading) return null

  if (error || !details) {
    return <ApiErrorPage title="Couldn't load this title" onRetry={retry} />
  }

  const onHeaderPlay = () => {
    if (continueItem) {
      playEpisode(details, {
        seasonNumber: continueItem.season ?? 1,
        episodeNumber: continueItem.episode ?? 1,
        name: continueItem.episodeTitle ?? '',
      })
    } else if (episodes && episodes.length > 0) {
      playEpisode(details, episodes[0])
    } else {
      void playSeriesFromStart(details)
    }
  }

  const playLabel = continueItem ? `Resume · S${continueItem.season} E${continueItem.episode}` : 'Play'

  return (
    <div className="pb-20">
      <DetailHeader details={details} onPlay={onHeaderPlay} playLoading={resolvingId === id} playLabel={playLabel} />

      <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
        <section id="episodes-section" className="mt-2 scroll-mt-24">
          <h2 className="mb-4 flex items-center gap-3 text-xl font-semibold text-white">
            <span className="h-5 w-1 shrink-0 rounded-full bg-accent" />
            Episodes
          </h2>

          <div className="mb-4 flex items-center gap-3">
            {seasons && seasons.length > 0 && selectedSeason !== null && (
              <SeasonSelector seasons={seasons} selected={selectedSeason} onChange={setSelectedSeason} />
            )}

            <div className="relative w-36 shrink-0 sm:w-52">
              <Search size={14} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={episodeQuery}
                onChange={(e) => setEpisodeQuery(e.target.value)}
                placeholder="Search episode..."
                aria-label="Search episodes"
                className="w-full rounded-lg border border-white/15 bg-white/5 py-2 pr-2.5 pl-8 text-xs text-white placeholder:text-muted outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setSortDesc((s) => !s)}
              aria-label={sortDesc ? 'Currently sorted newest first, switch to oldest first' : 'Currently sorted oldest first, switch to newest first'}
              aria-pressed={sortDesc}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ArrowUpDown size={14} />
            </button>
          </div>

          <EpisodeList
            episodes={visibleEpisodes}
            loading={episodesLoading || selectedSeason === null}
            error={episodesError}
            onPlay={(episode) => playEpisode(details, episode)}
          />
        </section>

        <CastList id={id} mediaType="tv" />
        <SimilarSection
          id={id}
          mediaType="tv"
          onSelect={(item) => (item.mediaType === 'movie' ? openMovie(item.id) : openSeries(item.id))}
        />
      </div>
    </div>
  )
}
