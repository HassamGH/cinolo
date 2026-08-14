import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { TopLoadingBar } from '../components/ui/TopLoadingBar'

interface LoadingBarContextValue {
  start: () => void
  stop: () => void
}

const LoadingBarContext = createContext<LoadingBarContextValue | null>(null)

export function LoadingBarProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false)
  const countRef = useRef(0)

  const start = useCallback(() => {
    countRef.current += 1
    setActive(true)
  }, [])

  const stop = useCallback(() => {
    countRef.current = Math.max(0, countRef.current - 1)
    if (countRef.current === 0) setActive(false)
  }, [])

  return (
    <LoadingBarContext.Provider value={{ start, stop }}>
      <TopLoadingBar active={active} />
      {children}
    </LoadingBarContext.Provider>
  )
}

export function useLoadingBar() {
  const ctx = useContext(LoadingBarContext)
  if (!ctx) throw new Error('useLoadingBar must be used within LoadingBarProvider')
  return ctx
}
