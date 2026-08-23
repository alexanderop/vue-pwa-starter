import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

/**
 * Storybook renders the real components without booting the production PWA.
 * The virtual service-worker module is replaced by a local inert adapter so
 * update-prompt states remain documentable without registering a worker.
 */
export function createStorybookViteConfig() {
  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@/composables/useInstallPrompt': fileURLToPath(
          new URL('.storybook/install-prompt.ts', import.meta.url),
        ),
        'virtual:pwa-register/vue': fileURLToPath(
          new URL('.storybook/pwa-register.ts', import.meta.url),
        ),
        '@': fileURLToPath(new URL('src', import.meta.url)),
      },
    },
    optimizeDeps: {
      include: ['@storybook/vue3-vite', 'storybook/preview-api', 'storybook/test'],
    },
  }
}

export default defineConfig(createStorybookViteConfig())
