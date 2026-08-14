import type { VercelRequest, VercelResponse } from '@vercel/node'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

// Second-tier cache only. Serverless instances are ephemeral and not shared
// between concurrent invocations, so most requests will miss this on a
// low-traffic project. The real win is the s-maxage header below, which lets
// Vercel's edge serve cached responses to every user.
type CacheEntry = { expires: number; body: unknown }
const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000
const CACHE_MAX_ENTRIES = 200

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const TMDB_API_KEY = process.env.TMDB_API_KEY
  if (!TMDB_API_KEY) {
    res.status(500).json({ error: 'Server is missing TMDB_API_KEY.' })
    return
  }

  // `path` is injected by the rewrite in vercel.json:
  //   /api/tmdb/:path*  ->  /api/tmdb?path=:path*
  // It arrives as a string ("trending/all/week"), but handle the array form
  // too in case the route config changes to a catch-all file later.
  const pathParam = req.query.path
  const rawPath = Array.isArray(pathParam) ? pathParam.join('/') : (pathParam ?? '')

  // Strip leading/trailing slashes so we never produce a double slash or an
  // empty segment against the TMDB base URL.
  const path = rawPath.replace(/^\/+|\/+$/g, '')
  if (!path) {
    res.status(400).json({ error: 'Missing TMDB path.' })
    return
  }

  let url: URL
  try {
    url = new URL(`${TMDB_BASE_URL}/${path}`)
  } catch {
    res.status(400).json({ error: 'Invalid TMDB path.' })
    return
  }

  // Forward every caller-supplied query param except the routing one.
  // Repeated params (e.g. ?with_genres=28&with_genres=12) arrive as arrays and
  // must be appended, not set, or all but one value is silently dropped.
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path' || key === 'api_key') continue
    if (Array.isArray(value)) {
      for (const v of value) url.searchParams.append(key, v)
    } else if (typeof value === 'string') {
      url.searchParams.set(key, value)
    }
  }

  // Build the cache key BEFORE the API key is attached, so rotating the key
  // doesn't silently invalidate every cached entry — and so the secret never
  // ends up as a Map key.
  const cacheKey = url.toString()
  url.searchParams.set('api_key', TMDB_API_KEY)

  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.setHeader('X-Cache', 'HIT')
    res.status(200).json(cached.body)
    return
  }

  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' },
    })

    const contentType = upstream.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      // TMDB returned HTML (rate-limit page, outage, bad path). Don't let
      // res.json() choke on it — surface a clean error instead.
      res.status(502).json({ error: 'Upstream TMDB returned a non-JSON response.' })
      return
    }

    const body = await upstream.json()

    if (upstream.ok) {
      if (cache.size >= CACHE_MAX_ENTRIES) {
        // Crude bound so a long-lived warm instance can't grow the Map without
        // limit. Evicts the oldest inserted key (Map preserves insertion order).
        const oldest = cache.keys().next()
        if (!oldest.done) cache.delete(oldest.value)
      }
      cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, body })
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
      res.setHeader('X-Cache', 'MISS')
    } else {
      // Never let the CDN cache an upstream error.
      res.setHeader('Cache-Control', 'no-store')
    }

    res.status(upstream.status).json(body)
  } catch (err) {
    console.error('[zeno-api] TMDB request failed', err)
    res.setHeader('Cache-Control', 'no-store')
    res.status(502).json({ error: 'Upstream TMDB request failed' })
  }
}