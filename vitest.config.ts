import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Separate from vite.config.ts so tests don't pull in the PWA/Tailwind
// plugins, which have nothing to do with unit tests and only slow them down.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // e2e/**/*.spec.ts are Playwright specs (run via `npm run test:e2e`),
    // not Vitest ones — their `test()` API isn't compatible with this runner.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
