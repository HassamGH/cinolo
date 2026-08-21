import type { VercelRequest, VercelResponse } from '@vercel/node'
import { logRequestError } from '../server/logger.js'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
// Comfortably under vercel.json's 10s maxDuration for this function, so we
// fail cleanly with our own 504 instead of the platform killing the
// invocation outright and returning an opaque FUNCTION_INVOCATION_TIMEOUT.
const TMDB_TIMEOUT_MS = 8000

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
  // Captured before api_key is attached, so it never leaks into a log line.
  const displayPath = `/api/tmdb/${path}${url.search}`
  url.searchParams.set('api_key', TMDB_API_KEY)

  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.setHeader('X-Cache', 'HIT')
    res.status(200).json(cached.body)
    return
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TMDB_TIMEOUT_MS)
  const startedAt = Date.now()
  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
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
    const timedOut = err instanceof Error && err.name === 'AbortError'
    const status = timedOut ? 504 : 502
    logRequestError({
      method: req.method ?? 'GET',
      path: displayPath,
      status,
      durationMs: Date.now() - startedAt,
      tag: timedOut ? 'TIMEOUT' : 'FAILED',
    })
    res.setHeader('Cache-Control', 'no-store')
    res.status(status).json({ error: timedOut ? 'Upstream TMDB request timed out' : 'Upstream TMDB request failed' })
  } finally {
    clearTimeout(timeout)
  }
}