import type { ContinueWatchingItem } from '../types/media'

const STORAGE_KEY = 'cinolo:continue-watching'
const MAX_ITEMS = 20
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

function safeParse(raw: string | null): ContinueWatchingItem[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ContinueWatchingItem[]) : []
  } catch {
    return []
  }
}

function pruneExpired(items: ContinueWatchingItem[]): ContinueWatchingItem[] {
  const cutoff = Date.now() - MAX_AGE_MS
  return items.filter((item) => item.updatedAt >= cutoff)
}

// Prunes anything untouched for a week and writes the result back, so an
// expired entry is actually deleted from storage (not just hidden from this
// read) the next time anything touches Continue Watching.
export function loadContinueWatching(): ContinueWatchingItem[] {
  const all = safeParse(window.localStorage.getItem(STORAGE_KEY))
  const pruned = pruneExpired(all)
  if (pruned.length !== all.length) persist(pruned)
  return pruned.sort((a, b) => b.updatedAt - a.updatedAt)
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
