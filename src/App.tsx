import { Suspense, lazy } from 'react'
import { NavigationProvider, useNavigation } from './context/NavigationContext'
import { LoadingBarProvider } from './context/LoadingBarContext'
import { ContinueWatchingProvider } from './context/ContinueWatchingContext'
import { AppReadyProvider, useAppReady } from './context/AppReadyContext'
import { OfflineProvider, useOffline } from './context/OfflineContext'
import { Header } from './components/Header'
import { HomePage } from './components/HomePage'
import { VideoPlayer } from './components/VideoPlayer'
import { AppLoader } from './components/ui/AppLoader'

// Split out of the main bundle: each is only needed once its screen/modal is
// actually opened, not on initial load.
const MovieDetail = lazy(() => import('./components/MovieDetail').then((m) => ({ default: m.MovieDetail })))
const SeriesDetail = lazy(() => import('./components/SeriesDetail').then((m) => ({ default: m.SeriesDetail })))
const SearchModal = lazy(() => import('./components/SearchModal').then((m) => ({ default: m.SearchModal })))

function scrollToRow(id: string) {
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function AppShell() {
  const { state, goHome } = useNavigation()
  const { ready } = useAppReady()
  const { offline } = useOffline()

  const onNavigate = (target: 'home' | 'movies' | 'tv') => {
    if (target === 'home') {
      goHome()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const rowId = target === 'movies' ? 'popular-movies' : 'popular-tv'
    if (state.screen.name !== 'home') {
      goHome()
      setTimeout(() => scrollToRow(rowId), 120)
    } else {
      scrollToRow(rowId)
    }
  }

  return (
    <div className="relative min-h-screen bg-background">
      {!ready && <AppLoader />}
      {!offline && <Header onNavigate={onNavigate} />}

      <main>
        {state.screen.name === 'home' && <HomePage />}
        <Suspense fallback={null}>
          {state.screen.name === 'movie' && <MovieDetail key={state.screen.id} id={state.screen.id} />}
          {state.screen.name === 'series' && <SeriesDetail key={state.screen.id} id={state.screen.id} />}
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <SearchModal open={state.searchOpen} />
      </Suspense>
      <VideoPlayer source={state.player} />
    </div>
  )
}

function App() {
  return (
    <AppReadyProvider>
      <OfflineProvider>
        <LoadingBarProvider>
          <ContinueWatchingProvider>
            <NavigationProvider>
              <AppShell />
            </NavigationProvider>
          </ContinueWatchingProvider>
        </LoadingBarProvider>
      </OfflineProvider>
    </AppReadyProvider>
  )
}

export default App
