import { useRegisterSW } from 'virtual:pwa-register/vue'

/**
 * Service-worker update flow for `registerType: 'prompt'` (vite.config.ts).
 * When a new version is deployed, `needRefresh` flips to true and
 * PwaUpdatePrompt.vue offers a reload instead of silently swapping the app
 * out from under the user mid-interaction.
 */
export function usePwaUpdate() {
  const { needRefresh, updateServiceWorker } = useRegisterSW({ immediate: true })

  function reload(): void {
    void updateServiceWorker(true)
  }

  function dismiss(): void {
    needRefresh.value = false
  }

  return { needRefresh, reload, dismiss }
}
