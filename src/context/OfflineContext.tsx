import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface OfflineContextValue {
  offline: boolean
  setOffline: (offline: boolean) => void
}

const OfflineContext = createContext<OfflineContextValue | null>(null)

// Whichever screen is currently showing ApiErrorPage reports it here, so
// AppShell can hide Header for it — one flag shared across screens instead
// of each one threading its own callback up through App.tsx.
export function OfflineProvider({ children }: { children: ReactNode }) {
  const [offline, setOffline] = useState(false)
  return <OfflineContext.Provider value={{ offline, setOffline }}>{children}</OfflineContext.Provider>
}

export function useOffline() {
  const ctx = useContext(OfflineContext)
  if (!ctx) throw new Error('useOffline must be used within OfflineProvider')
  return ctx
}

// A page calls this with whether it's currently showing ApiErrorPage.
// Resets to false on unmount/change first, so navigating away always hands
// the flag back cleanly instead of leaving a stale "offline" behind.
export function useReportOffline(offline: boolean) {
  const { setOffline } = useOffline()
  useEffect(() => {
    setOffline(offline)
    return () => setOffline(false)
  }, [offline, setOffline])
}
