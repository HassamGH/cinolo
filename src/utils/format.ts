export function formatRuntime(minutes: number | null): string | null {
  if (!minutes) return null
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`
}

export function formatRating(rating: number | null): string | null {
  if (rating === null || rating === undefined || rating <= 0) return null
  return rating.toFixed(1)
}

export function formatMetaLine(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(' · ')
}
