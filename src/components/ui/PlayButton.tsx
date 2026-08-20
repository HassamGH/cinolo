import { Play } from 'lucide-react'

interface PlayButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  ariaLabel?: string
  compact?: boolean
}

// Shared Play/Resume button — used identically on the hero carousel, search
// results, and movie/series detail pages so it reads as one consistent
// control everywhere it appears. `compact` matches search results' smaller
// inline footprint.
export function PlayButton({ label, onClick, disabled = false, ariaLabel, compact = false }: PlayButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`flex cursor-pointer items-center rounded bg-white font-semibold text-black transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 ${
        compact ? 'gap-1 px-3 py-1 text-xs' : 'gap-1.5 px-4 py-2 text-sm'
      }`}
    >
      <Play size={compact ? 12 : 16} />
      {label}
    </button>
  )
}
