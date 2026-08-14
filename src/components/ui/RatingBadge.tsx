import { Star } from 'lucide-react'
import { formatRating } from '../../utils/format'

export function RatingBadge({ rating, className = '' }: { rating: number | null; className?: string }) {
  const formatted = formatRating(rating)
  if (!formatted) return null
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium text-white ${className}`}>
      <Star size={14} className="fill-accent text-accent" />
      {formatted}
    </span>
  )
}
