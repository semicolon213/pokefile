import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 저장소 경로 (ADR-005). 저장소 이름이 바뀌면 함께 수정한다.
  base: '/pokefile/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/{unit,integration}/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup/vitest.setup.ts'],
  },
})
