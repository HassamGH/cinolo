import { Clapperboard } from 'lucide-react'

export function PosterPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-linear-to-br from-surface to-card text-muted/40 ${className}`}
    >
      <Clapperboard size={28} strokeWidth={1.5} />
    </div>
  )
}

export function BackdropPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-linear-to-br from-[#141414] to-background text-muted/30 ${className}`}
    >
      <Clapperboard size={56} strokeWidth={1} />
    </div>
  )
}
