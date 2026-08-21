import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadContinueWatching, saveContinueWatching } from './continueWatching'
import type { ContinueWatchingItem } from '../types/media'

const STORAGE_KEY = 'cinolo:continue-watching'
const ONE_DAY_MS = 24 * 60 * 60 * 1000

function seed(items: ContinueWatchingItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function entry(overrides: Partial<ContinueWatchingItem> = {}): ContinueWatchingItem {
  return {
    key: 'movie:1',
    mediaType: 'movie',
    id: 1,
    title: 'Old Movie',
    posterPath: null,
    backdropPath: null,
    updatedAt: Date.now(),
    ...overrides,
  }
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('continueWatching expiry', () => {
  it('drops an entry untouched for more than a week', () => {
    seed([entry({ updatedAt: Date.now() - 8 * ONE_DAY_MS })])
    expect(loadContinueWatching()).toEqual([])
  })

  it('keeps an entry updated within the last week', () => {
    const recent = entry({ updatedAt: Date.now() - 2 * ONE_DAY_MS })
    seed([recent])
    expect(loadContinueWatching()).toEqual([recent])
  })

  it('actually deletes the expired entry from localStorage, not just from the returned list', () => {
    const stale = entry({ key: 'movie:1', updatedAt: Date.now() - 8 * ONE_DAY_MS })
    const fresh = entry({ key: 'movie:2', id: 2, updatedAt: Date.now() })
    seed([stale, fresh])

    loadContinueWatching()

    const persisted = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as ContinueWatchingItem[]
    expect(persisted).toEqual([fresh])
  })

  it('expires an entry that ages past a week between two loads', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    saveContinueWatching({ key: 'movie:1', mediaType: 'movie', id: 1, title: 'x', posterPath: null, backdropPath: null })

    expect(loadContinueWatching()).toHaveLength(1)

    vi.setSystemTime(new Date('2026-01-09T00:00:01Z'))
    expect(loadContinueWatching()).toHaveLength(0)
  })
})
