import { render } from 'vitest-browser-vue'
import { createMemoryHistory } from 'vue-router'
import App from '@/App.vue'
import { i18n } from '@/i18n'
import { createAppRouter } from '@/router'

/**
 * Mounts the full app (shell, router, i18n) the way main.ts does, but with
 * memory history so tests don't fight over the page URL.
 */
export async function renderApp(initialPath = '/') {
  const router = createAppRouter(createMemoryHistory())
  await router.push(initialPath)
  await router.isReady()

  const screen = render(App, {
    global: {
      plugins: [i18n, router],
    },
  })

  return {
    screen,
    container: screen.container,
    router,
    cleanup: (): void => {
      void screen.unmount()
    },
  }
}
