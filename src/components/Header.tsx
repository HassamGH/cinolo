import { Search } from 'lucide-react'
import { useNavigation } from '../context/NavigationContext'
import { CinoloMark } from './ui/CinoloMark'

interface HeaderProps {
  onNavigate: (target: 'home' | 'movies' | 'tv') => void
}

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

export function Header({ onNavigate }: HeaderProps) {
  const { openSearch } = useNavigation()

  return (
    <header className="absolute inset-x-0 top-0 z-40 bg-linear-to-b from-black/80 via-black/30 to-transparent">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 sm:px-8">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className={`flex cursor-pointer items-center gap-2.5 ${FOCUS_RING}`}
          aria-label="Cinolo home"
        >
          <CinoloMark className="h-8 w-8 shrink-0" />
          <span className="text-xl font-bold tracking-tight text-white">CINOLO</span>
        </button>

        <div className="flex items-center gap-6 sm:gap-8">
          <nav className="hidden items-center gap-6 text-sm font-medium text-white/85 md:flex lg:gap-8">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className={`cursor-pointer transition-colors hover:text-white ${FOCUS_RING}`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => onNavigate('movies')}
              className={`cursor-pointer transition-colors hover:text-white ${FOCUS_RING}`}
            >
              Movies
            </button>
            <button
              type="button"
              onClick={() => onNavigate('tv')}
              className={`cursor-pointer transition-colors hover:text-white ${FOCUS_RING}`}
            >
              TV Series
            </button>
          </nav>

          <button
            type="button"
            onClick={openSearch}
            aria-label="Search"
            className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded text-white transition-colors hover:bg-white/10 ${FOCUS_RING}`}
          >
            <Search size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
