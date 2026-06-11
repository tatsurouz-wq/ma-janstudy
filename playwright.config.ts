import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5181',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx vite --port 5181 --strictPort',
    url: 'http://localhost:5181',
    reuseExistingServer: !process.env.CI,
  },
})
