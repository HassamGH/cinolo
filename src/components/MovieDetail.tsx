import { useEffect } from 'react'
import { useNavigation } from '../context/NavigationContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { usePlayMedia } from '../hooks/usePlayMedia'
import { useLoadingBar } from '../context/LoadingBarContext'
import { useAppReady } from '../context/AppReadyContext'
import { useReportOffline } from '../context/OfflineContext'
import { useContinueWatching } from '../context/ContinueWatchingContext'
import { getMovieDetails } from '../services/tmdb'
import { DetailHeader } from './DetailHeader'
import { CastList } from './CastList'
import { SimilarSection } from './SimilarSection'
import { ApiErrorPage } from './ui/ApiErrorPage'

export function MovieDetail({ id }: { id: number }) {
  const { openMovie, openSeries } = useNavigation()
  const { playMovie } = usePlayMedia()
  const { start, stop } = useLoadingBar()
  const { markReady } = useAppReady()
  const { items: continueWatchingItems } = useContinueWatching()
  const { data: details, loading, error, retry } = useAsyncData(() => getMovieDetails(id), [id])
  const isResuming = continueWatchingItems.some((item) => item.key === `movie:${id}`)
  const failed = !loading && (Boolean(error) || !details)

  useEffect(() => {
    if (!loading) {
      markReady()
      return
    }
    start()
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  useReportOffline(failed)

  if (loading) return null

  if (error || !details) {
    return <ApiErrorPage title="Couldn't load this title" onRetry={retry} />
  }

  return (
    <div className="pb-20">
      <DetailHeader details={details} onPlay={() => playMovie(details)} playLabel={isResuming ? 'Resume' : 'Play'} />
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
        <CastList id={details.id} mediaType="movie" />
        <SimilarSection
          id={details.id}
          mediaType="movie"
          onSelect={(item) => (item.mediaType === 'movie' ? openMovie(item.id) : openSeries(item.id))}
        />
      </div>
    </div>
  )
}
