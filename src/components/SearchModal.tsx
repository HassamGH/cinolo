import { useEffect, useRef, useState } from 'react'
import { Search, SearchX, X } from 'lucide-react'
import { useNavigation } from '../context/NavigationContext'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { usePlayMedia } from '../hooks/usePlayMedia'
import { useLoadingBar } from '../context/LoadingBarContext'
import { searchMoviesAndSeries } from '../services/tmdb'
import { SearchResultItem } from './SearchResultItem'
import { Dropdown } from './ui/Dropdown'
import type { MediaSummary } from '../types/media'

const FILTER_OPTIONS = [
  { value: 'all', label: 'Movies & TV Shows' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV Shows' },
]

type SearchFilter = 'all' | 'movie' | 'tv'

export function SearchModal({ open }: { open: boolean }) {
  const { closeSearch, openMovie, openSeries } = useNavigation()
  const { play, isResuming, resolvingId } = usePlayMedia()
  const { start, stop } = useLoadingBar()

  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 350)
  const [results, setResults] = useState<MediaSummary[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<SearchFilter>('all')
  const inputRef = useRef<HTMLInputElement>(null)

  useLockBodyScroll(open)
  useEscapeKey(closeSearch, open)

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
    setQuery('')
    setResults(null)
    setError(null)
    setFilter('all')
  }, [open])

  useEffect(() => {
    if (!open) return
    const trimmed = debouncedQuery.trim()
    if (!trimmed) {
      setResults(null)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    start()
    searchMoviesAndSeries(trimmed)
      .then((data) => {
        if (!cancelled) setResults(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Search failed.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
        stop()
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, open])

  if (!open) return null

  const onSeeMore = (item: MediaSummary) => {
    if (item.mediaType === 'movie') openMovie(item.id)
    else openSeries(item.id)
  }

  const movies = filter === 'tv' ? [] : (results?.filter((r) => r.mediaType === 'movie') ?? [])
  const series = filter === 'movie' ? [] : (results?.filter((r) => r.mediaType === 'tv') ?? [])
  const hasResults = movies.length > 0 || series.length > 0

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md"
      onClick={closeSearch}
      role="dialog"
      aria-modal="true"
      aria-label="Search Cinolo"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-auto w-full max-w-2xl px-5 pt-20 pb-10 sm:px-0 sm:pt-28"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Search</h2>

          <div className="flex items-center gap-2.5">
            <Dropdown
              ariaLabel="Filter search results"
              value={filter}
              onChange={(v) => setFilter(v as SearchFilter)}
              options={FILTER_OPTIONS}
              showFocusRing={false}
            />

            <button
              type="button"
              onClick={closeSearch}
              aria-label="Close search"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10 focus-visible:outline-none"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="relative mt-5">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type here to search..."
            aria-label="Search movies and TV shows"
            className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pr-4 pl-10 text-sm text-white placeholder:text-muted outline-none"
          />
        </div>

        <div className="mt-6 max-h-[55vh] overflow-y-auto mask-[linear-gradient(to_bottom,black_calc(100%-90px),transparent_100%)]">
          {!debouncedQuery.trim() && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted">
              <Search size={32} className="opacity-40" />
              <p>Search for movies, TV shows, or actors.</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
              <Search size={28} className="opacity-40" />
              <p>Searching Cinolo...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted">
              <SearchX size={32} className="opacity-40" />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && debouncedQuery.trim() && results && !hasResults && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted">
              <SearchX size={32} className="opacity-40" />
              <p>No results for "{debouncedQuery}"</p>
            </div>
          )}

          {!loading && !error && movies.length > 0 && (
            <div className="mb-4">
              <h3 className="px-2 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">Movies</h3>
              {movies.map((item) => (
                <SearchResultItem
                  key={`movie-${item.id}`}
                  item={item}
                  onPlay={play}
                  onSeeMore={onSeeMore}
                  playLoading={resolvingId === item.id}
                  isResuming={isResuming(item)}
                />
              ))}
            </div>
          )}

          {!loading && !error && series.length > 0 && (
            <div className="mb-4">
              <h3 className="px-2 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">TV Series</h3>
              {series.map((item) => (
                <SearchResultItem
                  key={`tv-${item.id}`}
                  item={item}
                  onPlay={play}
                  onSeeMore={onSeeMore}
                  playLoading={resolvingId === item.id}
                  isResuming={isResuming(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
