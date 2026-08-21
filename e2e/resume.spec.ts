import { test, expect } from '@playwright/test'

const PLAY_RE = /^(Play|Resume)\b/
const CONTINUE_WATCHING_KEY = 'cinolo:continue-watching'

test.beforeEach(async ({ page }) => {
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`[browser console error] ${msg.text()}`)
  })
})

test('boots, searches, plays a title, and resumes it on revisit', async ({ page }) => {
  await test.step('home page boots with content', async () => {
    await page.goto('/')
    await expect(page.getByText('Trending Now')).toBeVisible({ timeout: 15_000 })
  })

  await test.step('search returns results for a debounced query', async () => {
    await page.getByRole('button', { name: 'Search' }).click()
    const input = page.getByRole('textbox', { name: 'Search movies and TV shows' })
    await input.fill('batman')
    await expect(page.getByText(/No results|Movies|TV Series/).first()).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: 'Close search' }).click()
  })

  let detailUrl = ''

  await test.step('opening a title from a row navigates to its detail page', async () => {
    // Home stays mounted during the async prefetch-then-navigate transition
    // (by design — see NavigationContext), so waiting for the URL itself is
    // the reliable signal that navigation actually landed, rather than
    // matching a same-labeled Play button that already exists on Home's Hero.
    const firstCard = page.locator('[role="button"][aria-label^="View details for"]').first()
    await firstCard.click()
    await page.waitForURL(/\/(movie|series)\/\d+/, { timeout: 15_000 })

    const playButton = page.getByRole('button', { name: PLAY_RE })
    await expect(playButton).toBeVisible({ timeout: 15_000 })
    await expect(playButton).toHaveText('Play')
    detailUrl = page.url()
  })

  await test.step('pressing play opens the embed and records continue-watching', async () => {
    await page.getByRole('button', { name: PLAY_RE }).click()
    await expect(page.locator('iframe')).toBeVisible({ timeout: 15_000 })

    const stored = await page.evaluate((key) => window.localStorage.getItem(key), CONTINUE_WATCHING_KEY)
    expect(stored).toBeTruthy()
    const entries = JSON.parse(stored ?? '[]') as Array<{ key: string }>
    expect(entries.length).toBeGreaterThan(0)

    await page.keyboard.press('Escape')
  })

  await test.step('revisiting the same title resumes instead of restarting', async () => {
    await page.goto(detailUrl)
    await expect(page.getByRole('button', { name: PLAY_RE })).toContainText('Resume', { timeout: 15_000 })
  })
})
