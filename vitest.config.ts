import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // Multi-environment setup for Convex and React tests
    environmentMatchGlobs: [
      // All tests in convex/ will run in edge-runtime
      ["convex/**", "edge-runtime"],
      // All other tests use your existing browser setup
      ["**", "browser"],
    ],
    browser: {
      enabled: true,
      provider: 'playwright',
      // https://vitest.dev/guide/browser/playwright
      instances: [
        { browser: 'chromium' },
      ],
    },
    server: {
      deps: { inline: ["convex-test"] }
    },
  },
})