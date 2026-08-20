import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { getCast, getEpisodes, getMovieDetails, getRecommendedFor, getSeriesDetails, getSeriesSeasons } from '../services/tmdb'
import { useLoadingBar } from './LoadingBarContext'
import type { PlayerSource } from '../types/media'

export type Screen = { name: 'home' } | { name: 'movie'; id: number } | { name: 'series'; id: number }

export interface NavState {
  screen: Screen
  searchOpen: boolean
  player: PlayerSource | null
}

interface HistoryEntry {
  nav: NavState
  seq: number
}

function parseScreenFromLocation(): Screen {
  const path = window.location.pathname
  const movieMatch = path.match(/^\/movie\/(\d+)$/)
  if (movieMatch) return { name: 'movie', id: Number(movieMatch[1]) }
  const seriesMatch = path.match(/^\/series\/(\d+)$/)
  if (seriesMatch) return { name: 'series', id: Number(seriesMatch[1]) }
  return { name: 'home' }
}

function urlForScreen(screen: Screen): string {
  if (screen.name === 'movie') return `/movie/${screen.id}`
  if (screen.name === 'series') return `/series/${screen.id}`
  return '/'
}

const HOME: NavState = { screen: { name: 'home' }, searchOpen: false, player: null }

interface NavigationContextValue {
  state: NavState
  openSearch: () => void
  closeSearch: () => void
  openMovie: (id: number) => void
  openSeries: (id: number) => void
  goHome: () => void
  openPlayer: (source: PlayerSource) => void
  closePlayer: () => void
  back: () => void
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { start, stop } = useLoadingBar()

  // Restores the movie/series page a hard reload (or a shared/bookmarked
  // link) landed on, instead of always dropping back to Home.
  const [state, setState] = useState<NavState>(() => ({
    screen: parseScreenFromLocation(),
    searchOpen: false,
    player: null,
  }))
  const seqRef = useRef(0)

  useEffect(() => {
    const initialNav: NavState = { screen: parseScreenFromLocation(), searchOpen: false, player: null }
    window.history.replaceState(
      { nav: initialNav, seq: 0 } satisfies HistoryEntry,
      '',
      urlForScreen(initialNav.screen)
    )

    const onPopState = (event: PopStateEvent) => {
      const entry = event.state as HistoryEntry | null
      if (entry) {
        seqRef.current = entry.seq
        setState(entry.nav)
      } else {
        seqRef.current = 0
        setState(HOME)
      }
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const push = useCallback((next: NavState) => {
    seqRef.current += 1
    window.history.pushState({ nav: next, seq: seqRef.current } satisfies HistoryEntry, '', urlForScreen(next.screen))
    setState(next)
  }, [])

  const goBackOrReset = useCallback((resetTo: NavState) => {
    if (seqRef.current > 0) {
      window.history.back()
    } else {
      window.history.replaceState(
        { nav: resetTo, seq: 0 } satisfies HistoryEntry,
        '',
        urlForScreen(resetTo.screen)
      )
      setState(resetTo)
    }
  }, [])

  const openSearch = useCallback(() => push({ ...state, searchOpen: true }), [push, state])
  const closeSearch = useCallback(() => goBackOrReset({ ...state, searchOpen: false }), [goBackOrReset, state])

  // Prefetch everything the destination screen renders on arrival — details,
  // cast, similar titles, and (for series) the first season's episodes —
  // plus its lazy-loaded chunk, all landing in tmdbClient's cache before the
  // screen actually switches. The current page stays put — with
  // TopLoadingBar indicating progress — until the destination can render
  // fully populated in one shot, instead of its sections popping in one by
  // one as their own fetches resolve after mount. The chunk import is a
  // static literal, so Vite resolves it to the same module App.tsx's lazy()
  // loads; running it here just warms the cache so the waits overlap
  // instead of the code-split chunk only starting to download after data
  // fetches already finished. On failure, navigate anyway; the destination
  // surfaces its own "couldn't be loaded" state.
  const openMovie = useCallback(
    (id: number) => {
      start()
      Promise.all([
        import('../components/MovieDetail'),
        getMovieDetails(id),
        getCast(id, 'movie'),
        getRecommendedFor(id, 'movie'),
      ])
        .catch(() => {})
        .finally(() => {
          push({ screen: { name: 'movie', id }, searchOpen: false, player: null })
          stop()
        })
    },
    [push, start, stop]
  )
  const openSeries = useCallback(
    (id: number) => {
      start()
      Promise.all([
        import('../components/SeriesDetail'),
        getSeriesDetails(id),
        getCast(id, 'tv'),
        getRecommendedFor(id, 'tv'),
        getSeriesSeasons(id).then((seasons) => {
          const defaultSeason = seasons.find((s) => s.seasonNumber === 1)?.seasonNumber ?? seasons[0]?.seasonNumber
          return defaultSeason !== undefined ? getEpisodes(id, defaultSeason) : null
        }),
      ])
        .catch(() => {})
        .finally(() => {
          push({ screen: { name: 'series', id }, searchOpen: false, player: null })
          stop()
        })
    },
    [push, start, stop]
  )

  const goHome = useCallback(() => push(HOME), [push])

  const openPlayer = useCallback((source: PlayerSource) => push({ ...state, player: source }), [push, state])
  const closePlayer = useCallback(() => goBackOrReset({ ...state, player: null }), [goBackOrReset, state])

  const back = useCallback(() => goBackOrReset(HOME), [goBackOrReset])

  return (
    <NavigationContext.Provider
      value={{ state, openSearch, closeSearch, openMovie, openSeries, goHome, openPlayer, closePlayer, back }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider')
  return ctx
}
