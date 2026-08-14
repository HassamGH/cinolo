import type { VercelRequest, VercelResponse } from '@vercel/node'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

// Per-instance only — serverless instances are ephemeral and not shared,
// but this still saves repeat calls within a warm instance.
type CacheEntry = { expires: number; body: unknown }
const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const TMDB_API_KEY = process.env.TMDB_API_KEY
  if (!TMDB_API_KEY) {
    res.status(500).json({ error: 'Server is missing TMDB_API_KEY.' })
    return
  }

  const pathParam = req.query.path
  const path = Array.isArray(pathParam) ? pathParam.join('/') : (pathParam ?? '')
  const url = new URL(`${TMDB_BASE_URL}/${path}`)
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue
    if (typeof value === 'string') url.searchParams.set(key, value)
  }
  url.searchParams.set('api_key', TMDB_API_KEY)

  const cacheKey = url.toString()
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    res.json(cached.body)
    return
  }

  try {
    const upstream = await fetch(url)
    const body = await upstream.json()
    if (upstream.ok) {
      cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, body })
    }
    res.status(upstream.status).json(body)
  } catch (err) {
    console.error('[zeno-api] TMDB request failed', err)
    res.status(502).json({ error: 'Upstream TMDB request failed' })
  }
}
