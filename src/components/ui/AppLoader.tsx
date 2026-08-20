import { CinoloMark } from './CinoloMark'

// Covers the whole screen only while the app boots — the first screen's
// initial data is still unresolved and there's nothing meaningful to show
// yet. Every load after that (navigation, retries, refetches) uses
// TopLoadingBar instead, never this.
export function AppLoader() {
  return (
    <div
      role="status"
      aria-label="Loading Cinolo"
      className="fixed inset-0 z-200 flex flex-col items-center justify-center gap-3 bg-background"
    >
      <CinoloMark className="h-16 w-16 animate-pulse" />
      <span className="text-lg font-extrabold tracking-wide text-white/80">CINOLO</span>
    </div>
  )
}
