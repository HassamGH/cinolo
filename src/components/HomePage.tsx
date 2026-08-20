import { useEffect } from 'react'
import { Hero } from './Hero'
import { ContentRow } from './ContentRow'
import { ApiErrorPage } from './ui/ApiErrorPage'
import { useAsyncData } from '../hooks/useAsyncData'
import {
  getPopularMovies,
  getPopularSeries,
  getRecentlyAdded,
  getRecommended,
  getTrending,
} from '../services/tmdb'
import { useNavigation } from '../context/NavigationContext'
import { useLoadingBar } from '../context/LoadingBarContext'
import { useAppReady } from '../context/AppReadyContext'
import { useReportOffline } from '../context/OfflineContext'
import type { MediaSummary } from '../types/media'

export function HomePage() {
  const { openMovie, openSeries } = useNavigation()
  const { start, stop } = useLoadingBar()
  const { markReady } = useAppReady()

  const trending = useAsyncData(getTrending, [])
  const popularMovies = useAsyncData(getPopularMovies, [])
  const popularSeries = useAsyncData(getPopularSeries, [])
  const recentlyAdded = useAsyncData(getRecentlyAdded, [])
  const recommended = useAsyncData(getRecommended, [])

  const initialLoading =
    trending.loading || popularMovies.loading || popularSeries.loading || recentlyAdded.loading || recommended.loading

  const rows = [trending, popularMovies, popularSeries, recentlyAdded, recommended]
  // Not gated on !initialLoading: a retry sets loading back to true while
  // keeping the previous error (see useAsyncData), so this stays true
  // across the retry instead of flashing to the empty Hero/rows in between.
  const allFailed = rows.every((row) => row.error)
  const retryAll = () => rows.forEach((row) => row.retry())

  useEffect(() => {
    if (!initialLoading) {
      markReady()
      return
    }
    start()
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoading])

  useReportOffline(allFailed)

  const onSelect = (item: MediaSummary) => {
    if (item.mediaType === 'movie') openMovie(item.id)
    else openSeries(item.id)
  }

  if (allFailed) {
    return <ApiErrorPage onRetry={retryAll} />
  }

  return (
    <div className="pb-20">
      <Hero candidates={trending.data} onSelect={onSelect} />

      <div className="mt-4 flex flex-col gap-10 sm:mt-6 sm:gap-12">
        <ContentRow
          title="Trending Now"
          items={trending.data}
          error={trending.error}
          onRetry={trending.retry}
          onSelect={onSelect}
        />
        <div id="popular-movies">
          <ContentRow
            title="Popular Movies"
            items={popularMovies.data}
            error={popularMovies.error}
            onRetry={popularMovies.retry}
            onSelect={onSelect}
          />
        </div>
        <div id="popular-tv">
          <ContentRow
            title="Popular TV Series"
            items={popularSeries.data}
            error={popularSeries.error}
            onRetry={popularSeries.retry}
            onSelect={onSelect}
          />
        </div>
        <ContentRow
          title="Recently Added"
          items={recentlyAdded.data}
          error={recentlyAdded.error}
          onRetry={recentlyAdded.retry}
          onSelect={onSelect}
        />
        <ContentRow
          title="Recommended For You"
          items={recommended.data}
          error={recommended.error}
          onRetry={recommended.retry}
          onSelect={onSelect}
        />
      </div>
    </div>
  )
}
