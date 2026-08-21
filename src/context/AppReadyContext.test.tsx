import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AppReadyProvider, useAppReady } from './AppReadyContext'

function wrapper({ children }: { children: ReactNode }) {
  return <AppReadyProvider>{children}</AppReadyProvider>
}

describe('AppReadyContext', () => {
  it('starts not ready', () => {
    const { result } = renderHook(() => useAppReady(), { wrapper })
    expect(result.current.ready).toBe(false)
  })

  it('flips ready to true after markReady', () => {
    const { result } = renderHook(() => useAppReady(), { wrapper })
    act(() => result.current.markReady())
    expect(result.current.ready).toBe(true)
  })

  it('markReady is idempotent — a second caller racing in is a no-op', () => {
    const { result, rerender } = renderHook(() => useAppReady(), { wrapper })
    act(() => result.current.markReady())
    expect(result.current.ready).toBe(true)

    // Home and a deep-linked movie/series screen can both call this; the
    // second call must not throw or change state.
    act(() => result.current.markReady())
    rerender()
    expect(result.current.ready).toBe(true)
  })

  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useAppReady())).toThrow('useAppReady must be used within AppReadyProvider')
  })
})
