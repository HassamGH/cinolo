import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { usePlayMedia } from './usePlayMedia'
import type { ContinueWatchingItem, Episode, MediaSummary, Season } from '../types/media'

const mocks = vi.hoisted(() => ({
  openPlayer: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  record: vi.fn(),
  getSeriesSeasons: vi.fn(),
  getEpisodes: vi.fn(),
  continueWatchingItems: [] as ContinueWatchingItem[],
}))

vi.mock('../context/NavigationContext', () => ({
  useNavigation: () => ({ openPlayer: mocks.openPlayer }),
}))
vi.mock('../context/LoadingBarContext', () => ({
  useLoadingBar: () => ({ start: mocks.start, stop: mocks.stop }),
}))
vi.mock('../context/ContinueWatchingContext', () => ({
  useContinueWatching: () => ({ items: mocks.continueWatchingItems, record: mocks.record }),
}))
vi.mock('../services/tmdb', () => ({
  getSeriesSeasons: (...args: unknown[]) => mocks.getSeriesSeasons(...args),
  getEpisodes: (...args: unknown[]) => mocks.getEpisodes(...args),
}))

function movie(overrides: Partial<MediaSummary> = {}): MediaSummary {
  return {
    id: 1,
    mediaType: 'movie',
    title: 'Movie One',
    overview: '',
    posterPath: null,
    backdropPath: null,
    year: '2024',
    rating: null,
    ...overrides,
  }
}

function series(overrides: Partial<MediaSummary> = {}): MediaSummary {
  return {
    id: 10,
    mediaType: 'tv',
    title: 'Series One',
    overview: '',
    posterPath: null,
    backdropPath: null,
    year: '2024',
    rating: null,
    ...overrides,
  }
}

function continueWatchingEntry(overrides: Partial<ContinueWatchingItem> = {}): ContinueWatchingItem {
  return {
    key: 'tv:10',
    mediaType: 'tv',
    id: 10,
    title: 'Series One',
    posterPath: null,
    backdropPath: null,
    updatedAt: 0,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.continueWatchingItems = []
})

describe('usePlayMedia', () => {
  it('playMovie opens the player and records a movie entry', () => {
    const { result } = renderHook(() => usePlayMedia())
    act(() => result.current.playMovie(movie()))

    expect(mocks.openPlayer).toHaveBeenCalledWith({ type: 'movie', id: 1, title: 'Movie One' })
    expect(mocks.record).toHaveBeenCalledWith(expect.objectContaining({ key: 'movie:1', mediaType: 'movie', id: 1 }))
  })

  it('playEpisode opens the player and records season/episode', () => {
    const { result } = renderHook(() => usePlayMedia())
    act(() => result.current.playEpisode(series(), { seasonNumber: 2, episodeNumber: 5, name: 'Ep 5' }))

    expect(mocks.openPlayer).toHaveBeenCalledWith({
      type: 'episode',
      seriesId: 10,
      seriesTitle: 'Series One',
      season: 2,
      episode: 5,
      episodeTitle: 'Ep 5',
    })
    expect(mocks.record).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'tv:10', season: 2, episode: 5, episodeTitle: 'Ep 5' })
    )
  })

  it('isResuming is true only for a matching continue-watching key', () => {
    mocks.continueWatchingItems = [continueWatchingEntry()]
    const { result } = renderHook(() => usePlayMedia())

    expect(result.current.isResuming(series())).toBe(true)
    expect(result.current.isResuming(movie())).toBe(false)
  })

  it('play() on a movie always calls playMovie, ignoring continue-watching state', () => {
    mocks.continueWatchingItems = [continueWatchingEntry({ key: 'movie:1', mediaType: 'movie', id: 1 })]
    const { result } = renderHook(() => usePlayMedia())

    act(() => result.current.play(movie()))

    expect(mocks.openPlayer).toHaveBeenCalledWith({ type: 'movie', id: 1, title: 'Movie One' })
    expect(mocks.getSeriesSeasons).not.toHaveBeenCalled()
  })

  it('play() on a series with a saved entry resumes at that season/episode instead of S1E1', () => {
    mocks.continueWatchingItems = [
      continueWatchingEntry({ season: 3, episode: 7, episodeTitle: 'Saved Ep' }),
    ]
    const { result } = renderHook(() => usePlayMedia())

    act(() => result.current.play(series()))

    expect(mocks.openPlayer).toHaveBeenCalledWith({
      type: 'episode',
      seriesId: 10,
      seriesTitle: 'Series One',
      season: 3,
      episode: 7,
      episodeTitle: 'Saved Ep',
    })
    expect(mocks.getSeriesSeasons).not.toHaveBeenCalled()
  })

  it('play() on a series with no saved entry resolves season 1 / episode 1 from TMDB', async () => {
    const seasons: Season[] = [
      { id: 1, seasonNumber: 0, name: 'Specials', episodeCount: 3, posterPath: null },
      { id: 2, seasonNumber: 1, name: 'Season 1', episodeCount: 8, posterPath: null },
    ]
    const episodes: Episode[] = [
      { id: 100, episodeNumber: 1, seasonNumber: 1, name: 'Pilot', overview: '', runtimeMinutes: 40, stillPath: null, airDate: null },
    ]
    mocks.getSeriesSeasons.mockResolvedValue(seasons)
    mocks.getEpisodes.mockResolvedValue(episodes)

    const { result } = renderHook(() => usePlayMedia())
    act(() => {
      result.current.play(series())
    })

    await waitFor(() => expect(mocks.openPlayer).toHaveBeenCalled())

    expect(mocks.getSeriesSeasons).toHaveBeenCalledWith(10)
    expect(mocks.getEpisodes).toHaveBeenCalledWith(10, 1)
    expect(mocks.openPlayer).toHaveBeenCalledWith({
      type: 'episode',
      seriesId: 10,
      seriesTitle: 'Series One',
      season: 1,
      episode: 1,
      episodeTitle: 'Pilot',
    })
  })

  it('falls back to the first available season when there is no season 1', async () => {
    const seasons: Season[] = [{ id: 5, seasonNumber: 2, name: 'Season 2', episodeCount: 6, posterPath: null }]
    const episodes: Episode[] = [
      { id: 200, episodeNumber: 1, seasonNumber: 2, name: 'S2 Opener', overview: '', runtimeMinutes: 40, stillPath: null, airDate: null },
    ]
    mocks.getSeriesSeasons.mockResolvedValue(seasons)
    mocks.getEpisodes.mockResolvedValue(episodes)

    const { result } = renderHook(() => usePlayMedia())
    await act(async () => {
      await result.current.playSeriesFromStart(series())
    })

    expect(mocks.getEpisodes).toHaveBeenCalledWith(10, 2)
    expect(result.current.resolveError).toBeNull()
  })

  it('sets resolveError and clears resolvingId when no seasons are found', async () => {
    mocks.getSeriesSeasons.mockResolvedValue([])

    const { result } = renderHook(() => usePlayMedia())
    await act(async () => {
      await result.current.playSeriesFromStart(series())
    })

    expect(result.current.resolveError).toBe('Could not start this series right now.')
    expect(result.current.resolvingId).toBeNull()
    expect(mocks.stop).toHaveBeenCalled()
    expect(mocks.openPlayer).not.toHaveBeenCalled()
  })

  it('sets resolveError when the resolved season has no episodes', async () => {
    mocks.getSeriesSeasons.mockResolvedValue([{ id: 1, seasonNumber: 1, name: 'Season 1', episodeCount: 0, posterPath: null }])
    mocks.getEpisodes.mockResolvedValue([])

    const { result } = renderHook(() => usePlayMedia())
    await act(async () => {
      await result.current.playSeriesFromStart(series())
    })

    expect(result.current.resolveError).toBe('Could not start this series right now.')
  })
})
