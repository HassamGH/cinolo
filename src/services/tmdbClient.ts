const IMAGE_BASE = 'https://image.tmdb.org/t/p'

export const imageUrl = (
  path: string | null | undefined,
  size: 'w185' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original'
): string | null => (path ? `${IMAGE_BASE}/${size}${path}` : null)

// Requests are deduped + cached in-memory for the life of the tab. Home-page
// rows and repeat searches reuse this instead of re-hitting the proxy.
const cache = new Map<string, Promise<unknown>>()
const CACHE_TTL_MS = 5 * 60 * 1000
const cacheTimestamps = new Map<string, number>()

export class TmdbError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'TmdbError'
    this.status = status
  }
}

export async function tmdbGet<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value))
  }
  const query = search.toString()
  const cacheKey = `${path}${query ? `?${query}` : ''}`

  const cachedAt = cacheTimestamps.get(cacheKey)
  if (cachedAt && Date.now() - cachedAt < CACHE_TTL_MS && cache.has(cacheKey)) {
    return cache.get(cacheKey) as Promise<T>
  }

  const request = (async () => {
    const res = await fetch(`/api/tmdb/${path}${query ? `?${query}` : ''}`)
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new TmdbError(body?.error ?? body?.status_message ?? `TMDB request failed (${res.status})`, res.status)
    }
    return res.json() as Promise<T>
  })()

  cache.set(cacheKey, request)
  cacheTimestamps.set(cacheKey, Date.now())

  try {
    return (await request) as T
  } catch (err) {
    cache.delete(cacheKey)
    cacheTimestamps.delete(cacheKey)
    throw err
  }
}
