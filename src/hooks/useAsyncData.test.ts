import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useAsyncData } from './useAsyncData'

describe('useAsyncData', () => {
  it('resolves with data and clears loading', async () => {
    const fetcher = vi.fn().mockResolvedValue(['a', 'b'])
    const { result } = renderHook(() => useAsyncData(fetcher, []))

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toEqual(['a', 'b'])
    expect(result.current.error).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('captures a thrown Error message', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useAsyncData(fetcher, []))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('boom')
    expect(result.current.data).toBeNull()
  })

  it('falls back to a generic message for a non-Error rejection', async () => {
    const fetcher = vi.fn().mockRejectedValue('nope')
    const { result } = renderHook(() => useAsyncData(fetcher, []))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Something went wrong.')
  })

  it('keeps the previous data/error visible while a retry is in flight', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('first failure'))
      .mockResolvedValueOnce(['ok'])
    const { result } = renderHook(() => useAsyncData(fetcher, []))

    await waitFor(() => expect(result.current.error).toBe('first failure'))

    act(() => result.current.retry())
    // Still mid-retry: the previous error stays visible instead of flashing
    // empty between "failed" and "failed again".
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe('first failure')

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(['ok'])
    expect(result.current.error).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('ignores a stale response after deps change before it resolves', async () => {
    let resolveFirst!: (value: string[]) => void
    const first = new Promise<string[]>((resolve) => {
      resolveFirst = resolve
    })
    const fetcher = vi.fn().mockImplementationOnce(() => first).mockResolvedValueOnce(['second'])

    const { result, rerender } = renderHook(({ dep }) => useAsyncData(fetcher, [dep]), {
      initialProps: { dep: 1 },
    })

    rerender({ dep: 2 })
    await waitFor(() => expect(result.current.data).toEqual(['second']))

    // The first fetch resolves late; its stale result must not overwrite
    // the newer one that already landed.
    act(() => resolveFirst(['first']))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(result.current.data).toEqual(['second'])
  })
})
