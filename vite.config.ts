import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    // The floating DevTools panel overlays the bottom of small viewports and
    // can swallow taps on the bottom navigation in browser-driven checks.
    ...(process.env.CI ? [] : [vueDevTools()]),
    VitePWA({
      // 'prompt' shows an in-app "update available" banner instead of silently
      // swapping the service worker — see src/composables/usePwaUpdate.ts.
      registerType: 'prompt',
      // Icons are generated at dev/build time from public/favicon.svg via
      // pwa-assets.config.ts and injected into the manifest automatically.
      pwaAssets: {
        config: true,
      },
      manifest: {
        name: 'Vue PWA Starter',
        short_name: 'Starter',
        description: 'Local-first Vue PWA starter with a complete testing strategy',
        // Hex mirror of --primary in src/style.css (manifests can't use CSS
        // variables) — update this if the primary token's hue ever changes.
        theme_color: '#7c3aed',
        background_color: '#ffffff',
        display: 'standalone',
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              request.destination === 'style' ||
              request.destination === 'script' ||
              request.destination === 'worker',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 24 * 60 * 60 },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
})
