import { test, expect } from '@playwright/test'

const ADMIN = 'http://localhost:3001'
const OWNER = { email: 'owner@e2e.test', password: 'e2e-test-password-123' }
const SITE_DOMAIN = 'localhost:3000'
const SLUG = 'e2e-test-page'

// Roadmap "E2E-тесты": создать страницу в админке → проверить на сайте → опубликовать → проверить purge кэша.
// Runs against a fresh, empty Postgres (see playwright.config.ts webServer + CI workflow) — the first
// user created self-registers as owner (apps/admin/src/utils/first-user.ts), no seed data involved.
test('create a page in admin, publish it, verify it renders on the site, verify cache purge', async ({ page, request, baseURL }) => {
  // --- bootstrap: first owner + a Site matching the web app's host ---
  await request.post(`${ADMIN}/api/users`, {
    data: { name: 'E2E Owner', email: OWNER.email, password: OWNER.password },
  })
  const login = await request.post(`${ADMIN}/api/users/login`, { data: OWNER })
  const { token } = await login.json()
  await request.post(`${ADMIN}/api/sites`, {
    headers: { Authorization: `JWT ${token}` },
    data: { name: 'E2E Site', slug: 'e2e', domain: SITE_DOMAIN, theme: 'default', locale: 'ru' },
  })

  // --- create the page through the real admin UI ---
  await page.goto(`${ADMIN}/admin/login`)
  await page.locator('#field-email').fill(OWNER.email)
  await page.locator('#field-password').fill(OWNER.password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(`${ADMIN}/admin`)

  await page.goto(`${ADMIN}/admin/collections/pages/create`)
  await page.locator('#field-site .rs__control').click()
  await page.getByRole('option').first().waitFor() // options load async — wait before selecting
  await page.keyboard.press('Enter') // only one Site exists — react-select auto-highlights it
  await page.locator('#field-title').fill('E2E Test Page')
  await page.locator('#field-slug').fill(SLUG)

  await page.locator('.blocks-field__drawer-toggler').click()
  await page.getByRole('button', { name: 'Hero', exact: true }).click()
  await page.locator('#field-sections__0__title').fill('Hello E2E')

  await page.locator('#action-save').click()
  await page.waitForURL(/\/admin\/collections\/pages\/(\d+)$/)
  const pageId = /\/pages\/(\d+)$/.exec(page.url())?.[1]

  // --- verify the published page renders on the real public site (actual HTTP, no mocking) ---
  const first = await request.get(`${baseURL}/${SLUG}`)
  expect(first.status()).toBe(200)
  expect(first.headers()['x-siril-cache']).toBe('MISS')
  expect(await first.text()).toContain('Hello E2E')

  const second = await request.get(`${baseURL}/${SLUG}`)
  expect(second.headers()['x-siril-cache']).toBe('HIT')

  // --- edit + republish: purge must invalidate the warm cache, not just leave it stale ---
  await page.locator('#field-sections__0__title').fill('Hello E2E Updated')
  const [patchResponse] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes(`/api/pages/${pageId}`) && resp.request().method() === 'PATCH'),
    page.locator('#action-save').click(),
  ])
  expect(patchResponse.ok()).toBe(true)

  // publishHook's purge call is fire-and-forget (apps/admin/src/utils/publish-hook.ts) — it may
  // land a moment after the PATCH response, so poll rather than asserting on the very next request.
  let afterRepublish: Awaited<ReturnType<typeof request.get>> | undefined
  await expect.poll(async () => {
    afterRepublish = await request.get(`${baseURL}/${SLUG}`)
    return afterRepublish.text()
  }, { timeout: 5_000 }).toContain('Hello E2E Updated')
  expect(afterRepublish!.headers()['x-siril-cache']).toBe('MISS')

  const afterRepublishAgain = await request.get(`${baseURL}/${SLUG}`)
  expect(afterRepublishAgain.headers()['x-siril-cache']).toBe('HIT')
})
