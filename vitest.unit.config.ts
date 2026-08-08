import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Node `unit` tier: pure logic specs that need no DOM and no browser.
 * Kept as its own config file (rather than only an inline project in
 * vitest.config.ts) so it can run in isolation without paying for the
 * plugin/browser setup the other tiers require — this is what makes it
 * fast enough for the pre-commit hook.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
  test: {
    name: 'unit',
    root: fileURLToPath(new URL('./', import.meta.url)),
    include: ['src/__tests__/unit/**/*.spec.ts'],
    globals: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    // Same shape as vitest.config.ts so the two tiers' reports are comparable
    // when Codecov puts them side by side under their flags. lcov is the one
    // that matters — it is what the upload reads; the rest is for local use.
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html', 'lcov'],
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/**/*.d.ts', 'src/__tests__/**', 'src/components/ui/**'],
    },
  },
})
