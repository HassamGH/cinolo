import { useEffect } from 'react'
import { useNavigation } from '../context/NavigationContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { usePlayMedia } from '../hooks/usePlayMedia'
import { useLoadingBar } from '../context/LoadingBarContext'
import { getMovieDetails } from '../services/tmdb'
import { DetailHeader } from './DetailHeader'
import { CastList } from './CastList'
import { SimilarSection } from './SimilarSection'

export function MovieDetail({ id }: { id: number }) {
  const { back, openMovie, openSeries } = useNavigation()
  const { playMovie } = usePlayMedia()
  const { start, stop } = useLoadingBar()
  const { data: details, loading, error } = useAsyncData(() => getMovieDetails(id), [id])

  useEffect(() => {
    if (!loading) return
    start()
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  if (loading) return null

  if (error || !details) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg text-white">This movie couldn't be loaded.</p>
        <button
          type="button"
          onClick={back}
          className="cursor-pointer rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Back to Cinolo
        </button>
      </div>
    )
  }

  return (
    <div className="pb-20">
      <DetailHeader details={details} onPlay={() => playMovie(details.id, details.title)} />
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
