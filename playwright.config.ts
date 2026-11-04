import { defineConfig, devices } from '@playwright/test'

// E2E (ADR-007). 빌드 결과물을 vite preview로 띄워 GitHub Pages와 같은 경로(/pokefile/)에서 검증한다.
const PORT = 4173

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}/pokefile/`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/pokefile/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
