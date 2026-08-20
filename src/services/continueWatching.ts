import type { ContinueWatchingItem } from '../types/media'

const STORAGE_KEY = 'cinolo:continue-watching'
const MAX_ITEMS = 20

function safeParse(raw: string | null): ContinueWatchingItem[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ContinueWatchingItem[]) : []
  } catch {
    return []
  }
}

export function loadContinueWatching(): ContinueWatchingItem[] {
  return safeParse(window.localStorage.getItem(STORAGE_KEY)).sort((a, b) => b.updatedAt - a.updatedAt)
}

function persist(items: ContinueWatchingItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Storage full or unavailable (private browsing) — resume just won't persist.
  }
}

export function saveContinueWatching(entry: Omit<ContinueWatchingItem, 'updatedAt'>): ContinueWatchingItem[] {
  const existing = loadContinueWatching().filter((item) => item.key !== entry.key)
  const next = [{ ...entry, updatedAt: Date.now() }, ...existing].slice(0, MAX_ITEMS)
  persist(next)
  return next
}

export function removeContinueWatching(key: string): ContinueWatchingItem[] {
  const next = loadContinueWatching().filter((item) => item.key !== key)
  persist(next)
  return next
}
