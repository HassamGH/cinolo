import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { ContinueWatchingItem } from '../types/media'
import { loadContinueWatching, removeContinueWatching, saveContinueWatching } from '../services/continueWatching'

interface ContinueWatchingContextValue {
  items: ContinueWatchingItem[]
  record: (entry: Omit<ContinueWatchingItem, 'updatedAt'>) => void
  remove: (key: string) => void
}

const ContinueWatchingContext = createContext<ContinueWatchingContextValue | null>(null)

export function ContinueWatchingProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ContinueWatchingItem[]>(() => loadContinueWatching())

  const record = useCallback((entry: Omit<ContinueWatchingItem, 'updatedAt'>) => {
    setItems(saveContinueWatching(entry))
  }, [])

  const remove = useCallback((key: string) => {
    setItems(removeContinueWatching(key))
  }, [])

  return (
    <ContinueWatchingContext.Provider value={{ items, record, remove }}>{children}</ContinueWatchingContext.Provider>
  )
}

export function useContinueWatching() {
  const ctx = useContext(ContinueWatchingContext)
  if (!ctx) throw new Error('useContinueWatching must be used within ContinueWatchingProvider')
  return ctx
}
