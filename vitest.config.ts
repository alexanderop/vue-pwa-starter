import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
import { VitePWA } from 'vite-plugin-pwa'
import { configDefaults, defineConfig } from 'vitest/config'

// Shared resolve config for path aliases
const resolve = {
  alias: {
    '@': fileURLToPath(new URL('src', import.meta.url)),
  },
}

// Pre-bundle dependencies to avoid Vite reloads during browser tests
const optimizeDependencies = {
  include: ['web-vitals', 'workbox-window'],
}

function browserConfig(name: string) {
  return {
    enabled: true,
    provider: playwright(),
    instances: [{ browser: 'chromium' as const, name }],
    headless: true,
    trace: {
      mode: 'retain-on-failure' as const,
      tracesDir: '.vitest/traces',
    },
  }
}

// Shared plugins for all browser projects
const plugins = [vue(), tailwindcss(), VitePWA({ devOptions: { enabled: true } })]

// Shared base configuration: component/feature/a11y/visual tests all run in
// Playwright browser mode for real-browser behavior (real CSS, real events,
// real IndexedDB APIs — no jsdom approximations).
const sharedTestConfig = {
  root: fileURLToPath(new URL('./', import.meta.url)),
  exclude: [...configDefaults.exclude, 'test/**'],
  fileParallelism: true,
  // Keep local feedback quick, but let CI report every failure.
  bail: process.env.CI ? 0 : 1,
  // Stricter locally for fast feedback, generous in CI (shared runners are slower).
  testTimeout: process.env.CI ? 15_000 : 8000,
  // A blanket retry hides regressions: a failed assertion fails the same way
  // the second time, so all a retry buys is a slower red. `condition` (4.1)
  // narrows it to the errors that are the browser rather than the app —
  // a lazy chunk that did not arrive, a page torn down mid-run. Locally,
  // where a flake is a thing to look at, there is no retry at all.
  retry: process.env.CI
    ? {
        count: 2,
        delay: 250,
        condition:
          /Failed to fetch dynamically imported module|has been closed|Execution context was destroyed|net::ERR/i,
      }
    : 0,
  slowTestThreshold: 1000,
  includeTaskLocation: true,
  chaiConfig: { truncateThreshold: 999 },
  // Prevent mocks and stubbed platform state leaking into later tests.
  restoreMocks: true,
  unstubEnvs: true,
  unstubGlobals: true,
  // Required for ArchUnitTS custom matchers
  globals: true,
  setupFiles: ['./src/__tests__/setup.ts'],
}

const coverageConfig = {
  provider: 'v8' as const,
  reporter: ['text-summary', 'html', 'lcov'],
  include: ['src/**/*.{ts,vue}'],
  exclude: ['src/**/*.d.ts', 'src/__tests__/**', 'src/components/ui/**'],
}

export default defineConfig({
  plugins,
  resolve,
  optimizeDeps: optimizeDependencies,
  test: {
    coverage: coverageConfig,

    // Tags (4.1) label a category that cuts across the tiers, and carry the
    // runner options that category needs. They are not a second tiering:
    // anything that follows a directory is already a project, and anything
    // that follows a name is `-t`. Defined once here and inherited by every
    // project; `strictTags` defaults to on, so a typo in a spec is an error
    // rather than a silently untagged test. Keep the list short, and keep
    // `src/__tests__/vitest.d.ts` in step.
    tags: [
      {
        name: 'flaky',
        description: 'Races the browser on purpose — retried on CI rather than deleted.',
        retry: process.env.CI ? { count: 3, delay: 250 } : 0,
        // Lower number wins, so this beats the project-level retry above for
        // the tests that have earned a more generous one.
        priority: 1,
      },
    ],

    // Tiered projects — see docs/testing-strategy.md for which tier a test
    // belongs in and why.
    projects: [
      // Unit: pure Node tier for logic with no DOM/browser dependency.
      './vitest.unit.config.ts',

      // Default: component + feature specs in a real browser.
      {
        plugins,
        resolve,
        optimizeDeps: optimizeDependencies,
        test: {
          ...sharedTestConfig,
          name: 'default',
          include: ['src/__tests__/**/*.spec.ts'],
          exclude: [
            ...sharedTestConfig.exclude,
            'src/__tests__/a11y/**',
            'src/__tests__/visual/**',
            'src/__tests__/unit/**',
          ],
          browser: browserConfig('default-browser'),
        },
      },

      // Accessibility: axe-core sweeps over rendered screens.
      {
        plugins,
        resolve,
        optimizeDeps: optimizeDependencies,
        test: {
          ...sharedTestConfig,
          name: 'a11y',
          include: ['src/__tests__/a11y/**/*.spec.ts'],
          browser: browserConfig('a11y-browser'),
        },
      },

      // Visual regression: screenshot comparisons (see the --update flow in
      // docs/testing-strategy.md).
      {
        plugins,
        resolve,
        optimizeDeps: optimizeDependencies,
        test: {
          ...sharedTestConfig,
          name: 'visual',
          include: ['src/__tests__/visual/**/*.spec.ts'],
          browser: {
            ...browserConfig('visual-browser'),
            expect: {
              toMatchScreenshot: {
                comparatorOptions: {
                  threshold: 0.2,
                  allowedMismatchedPixelRatio: 0.02,
                },
              },
            },
          },
        },
      },

      // Architecture: ArchUnitTS rules, runs in Node for filesystem analysis.
      {
        resolve,
        test: {
          name: 'arch',
          globals: true,
          restoreMocks: true,
          unstubEnvs: true,
          unstubGlobals: true,
          include: ['src/__tests__/architecture/**/*.test.ts'],
          // Each file parses the whole TypeScript project; running them
          // concurrently starves every worker on small CI runners.
          fileParallelism: false,
          testTimeout: 60_000,
        },
      },
    ],
  },
})
