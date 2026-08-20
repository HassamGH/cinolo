import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface AppReadyContextValue {
  ready: boolean
  markReady: () => void
}

const AppReadyContext = createContext<AppReadyContextValue | null>(null)

// Tracks only the very first screen's initial data settling (success or
// failure) — after that it's permanently true. Whichever screen the app
// boots into (home, or a deep-linked movie/series) calls markReady() once,
// then every later navigation relies on TopLoadingBar instead.
export function AppReadyProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const firedRef = useRef(false)

  const markReady = useCallback(() => {
    if (firedRef.current) return
    firedRef.current = true
    setReady(true)
  }, [])

  return <AppReadyContext.Provider value={{ ready, markReady }}>{children}</AppReadyContext.Provider>
}

export function useAppReady() {
  const ctx = useContext(AppReadyContext)
  if (!ctx) throw new Error('useAppReady must be used within AppReadyProvider')
  return ctx
}
