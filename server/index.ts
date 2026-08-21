import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { logRequestError } from './logger'

const app = express()
const PORT = Number(process.env.PORT) || 8787
const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_TIMEOUT_MS = 8000

if (!TMDB_API_KEY) {
  console.warn(
    '[cinolo-server] TMDB_API_KEY is not set. Copy .env.example to .env and add your key from https://www.themoviedb.org/settings/api'
  )
}

app.use(cors())

// Simple in-memory TTL cache so identical requests (home rows, repeated
// searches) don't hammer TMDB. Not persisted, not shared across processes.
type CacheEntry = { expires: number; body: unknown }
const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000

app.get('/api/tmdb/*splat', async (req, res) => {
  if (!TMDB_API_KEY) {
    res.status(500).json({ error: 'Server is missing TMDB_API_KEY. See .env.example.' })
    return
  }

  const path = (req.params as { splat?: string[] }).splat?.join('/') ?? ''
  const url = new URL(`${TMDB_BASE_URL}/${path}`)
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === 'string') url.searchParams.set(key, value)
  }
  // Captured before api_key is attached, so it never leaks into a log line.
  const displayPath = `/api/tmdb/${path}${url.search}`
  url.searchParams.set('api_key', TMDB_API_KEY)

  const cacheKey = url.toString()
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    res.json(cached.body)
    return
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TMDB_TIMEOUT_MS)
  const startedAt = Date.now()
  try {
    const upstream = await fetch(url, { signal: controller.signal })
    const body = await upstream.json()
    if (upstream.ok) {
      cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, body })
    }
    res.status(upstream.status).json(body)
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'AbortError'
    const status = timedOut ? 504 : 502
    logRequestError({
      method: req.method,
      path: displayPath,
      status,
      durationMs: Date.now() - startedAt,
      tag: timedOut ? 'TIMEOUT' : 'FAILED',
    })
    res.status(status).json({ error: timedOut ? 'Upstream TMDB request timed out' : 'Upstream TMDB request failed' })
  } finally {
    clearTimeout(timeout)
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, hasKey: Boolean(TMDB_API_KEY) })
})

app.listen(PORT, () => {
  console.log(`[cinolo-server] TMDB proxy listening on http://localhost:${PORT}`)
})
