import { useNavigation } from '../context/NavigationContext'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { getVideoSource } from '../services/vidcore'
import type { PlayerSource } from '../types/media'

// Vidcore's embed already ships a full player (playback controls, progress,
// volume, fullscreen, quality, title, its own close/back chrome) — see
// services/vidcore.ts. Cinolo adds no chrome of its own on top: exit via
// Escape or the browser's back button (both wired in NavigationContext).
export function VideoPlayer({ source }: { source: PlayerSource | null }) {
  const { closePlayer } = useNavigation()
  const open = source !== null

  useLockBodyScroll(open)
  useEscapeKey(closePlayer, open)

  if (!source) return null

  const embedUrl = getVideoSource(source)
  const title =
    source.type === 'movie'
      ? source.title
      : `${source.seriesTitle} — S${source.season}:E${source.episode} "${source.episodeTitle}"`

  return (
    <div className="fixed inset-0 z-60 bg-black" role="dialog" aria-modal="true" aria-label={title}>
      <iframe
        key={embedUrl}
        src={embedUrl}
        title={title}
        className="h-full w-full"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="origin"
        // No `sandbox` attribute: Vidcore's player actively detects it and
        // refuses to play ("Please Disable Sandbox"), so a working player
        // takes priority over sandboxing it against the rare hijack case.
      />
    </div>
  )
}
