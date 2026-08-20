import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = Number(process.env.PORT) || 8787
const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

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
    console.error('[cinolo-server] TMDB request failed', err)
    res.status(502).json({ error: 'Upstream TMDB request failed' })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, hasKey: Boolean(TMDB_API_KEY) })
})

app.listen(PORT, () => {
  console.log(`[cinolo-server] TMDB proxy listening on http://localhost:${PORT}`)
})
