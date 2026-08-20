import { CloudOff, RefreshCw } from 'lucide-react'
import { CinoloMark } from './CinoloMark'

interface ApiErrorPageProps {
  title?: string
  message?: string
  onRetry?: () => void
}

// Full-screen takeover shown when the TMDB proxy is entirely unreachable —
// AppShell hides the Header while this is up, so this owns the whole
// viewport and carries its own branding instead of a boxed-in card.
export function ApiErrorPage({
  title = 'Catalog is offline',
  message = "We can't reach Cinolo's catalog right now. It's usually back within a few minutes.",
  onRetry,
}: ApiErrorPageProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 text-center">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 32%, rgba(229, 9, 20, 0.14), transparent 60%)' }}
      />

      <div className="relative flex flex-col items-center">
        <CinoloMark className="mb-6 h-16 w-16" />

        <CloudOff className="mb-5 text-muted opacity-50" size={40} strokeWidth={1.5} />
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted sm:text-base">{message}</p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        )}
      </div>
    </div>
  )
}
