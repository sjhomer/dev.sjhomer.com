import { defineConfig, devices } from '@playwright/test'

/*
 * End-to-end boot/flow checks. The dev server does SSR, so it is the simplest
 * reliable target for the scaffold (the Cloudflare preview path is exercised by
 * the deploy pipeline). Later releases add the terminal command flows here.
 *
 * A dedicated strict port (9371) keeps e2e from silently targeting whatever
 * else happens to be on the dev port (9370) or elsewhere.
 */
const PORT = Number(process.env.E2E_PORT ?? 9371)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `pnpm exec vite dev --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
