import { useEffect } from 'react'
import { Hero } from './Hero'
import { ContentRow } from './ContentRow'
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
import type { MediaSummary } from '../types/media'

export function HomePage() {
  const { openMovie, openSeries } = useNavigation()
  const { start, stop } = useLoadingBar()

  const trending = useAsyncData(getTrending, [])
  const popularMovies = useAsyncData(getPopularMovies, [])
  const popularSeries = useAsyncData(getPopularSeries, [])
  const recentlyAdded = useAsyncData(getRecentlyAdded, [])
  const recommended = useAsyncData(getRecommended, [])

  const initialLoading =
    trending.loading || popularMovies.loading || popularSeries.loading || recentlyAdded.loading || recommended.loading

  useEffect(() => {
    if (!initialLoading) return
    start()
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoading])

  const onSelect = (item: MediaSummary) => {
    if (item.mediaType === 'movie') openMovie(item.id)
    else openSeries(item.id)
  }

  return (
    <div className="pb-20">
      <Hero candidates={trending.data} onSelect={onSelect} />

      <div className="mt-8 flex flex-col gap-10 sm:mt-12 sm:gap-12">
        <ContentRow title="Trending Now" items={trending.data} error={trending.error} onSelect={onSelect} />
        <div id="popular-movies">
          <ContentRow title="Popular Movies" items={popularMovies.data} error={popularMovies.error} onSelect={onSelect} />
        </div>
        <div id="popular-tv">
          <ContentRow title="Popular TV Series" items={popularSeries.data} error={popularSeries.error} onSelect={onSelect} />
        </div>
        <ContentRow title="Recently Added" items={recentlyAdded.data} error={recentlyAdded.error} onSelect={onSelect} />
        <ContentRow title="Recommended For You" items={recommended.data} error={recommended.error} onSelect={onSelect} />
      </div>
    </div>
  )
}
