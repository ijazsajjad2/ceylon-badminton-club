import { defineConfig, devices } from '@playwright/test'

// e2e smoke tests against the dev server. `npm run test:e2e` boots Vite
// itself (webServer below) so there's no manual "start the app first" step.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use the sandbox's pre-installed Chromium build instead of letting
        // Playwright manage (and try to download) its own pinned browser.
        launchOptions: process.env.PLAYWRIGHT_BROWSERS_PATH
          ? { executablePath: `${process.env.PLAYWRIGHT_BROWSERS_PATH}/chromium` }
          : undefined,
      },
    },
  ],
})
