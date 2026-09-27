import { defineConfig } from '@playwright/test'

const ADMIN_PORT = 3001
const WEB_PORT = 3000

const env = {
  PAYLOAD_DB_URI: process.env.PAYLOAD_DB_URI ?? 'postgresql://payload:dev@localhost:5432/payload',
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ?? 'e2e-secret-at-least-32-characters-long',
  PAYLOAD_URL: `http://localhost:${ADMIN_PORT}`,
  NUXT_URL: `http://localhost:${WEB_PORT}`,
  PURGE_TOKEN: process.env.PURGE_TOKEN ?? 'e2e-purge-token',
  NUXT_PUBLIC_SITE_DOMAIN: `localhost:${WEB_PORT}`,
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'pnpm --filter @siril/admin build && pnpm --filter @siril/admin start',
      url: `http://localhost:${ADMIN_PORT}/admin/login`,
      cwd: '..',
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
      env: { ...env, PORT: String(ADMIN_PORT) },
    },
    {
      command: 'pnpm --filter @siril/web build && pnpm --filter @siril/web start',
      url: `http://localhost:${WEB_PORT}/api/health`,
      cwd: '..',
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
      env: { ...env, PORT: String(WEB_PORT) },
    },
  ],
})
