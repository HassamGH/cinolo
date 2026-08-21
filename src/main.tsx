import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Installed PWAs get resumed from a suspended state rather than doing a
// fresh navigation, so a new build can sit precached and unused forever
// unless we force a reload once its service worker actually takes over.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
