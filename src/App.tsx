import { NavigationProvider, useNavigation } from './context/NavigationContext'
import { LoadingBarProvider } from './context/LoadingBarContext'
import { Header } from './components/Header'
import { HomePage } from './components/HomePage'
import { MovieDetail } from './components/MovieDetail'
import { SeriesDetail } from './components/SeriesDetail'
import { SearchModal } from './components/SearchModal'
import { VideoPlayer } from './components/VideoPlayer'

function scrollToRow(id: string) {
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function AppShell() {
  const { state, goHome } = useNavigation()

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
      <Header onNavigate={onNavigate} />

      <main>
        {state.screen.name === 'home' && <HomePage />}
        {state.screen.name === 'movie' && <MovieDetail key={state.screen.id} id={state.screen.id} />}
        {state.screen.name === 'series' && <SeriesDetail key={state.screen.id} id={state.screen.id} />}
      </main>

      <SearchModal open={state.searchOpen} />
      <VideoPlayer source={state.player} />
    </div>
  )
}

function App() {
  return (
    <LoadingBarProvider>
      <NavigationProvider>
        <AppShell />
      </NavigationProvider>
    </LoadingBarProvider>
  )
}

export default App
