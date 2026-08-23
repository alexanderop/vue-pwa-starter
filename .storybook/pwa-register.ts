import { shallowRef } from 'vue'

/** Storybook-only replacement for vite-plugin-pwa's virtual Vue module. */
export function useRegisterSW() {
  return {
    needRefresh: shallowRef(false),
    offlineReady: shallowRef(false),
    updateServiceWorker: async (): Promise<void> => undefined,
  }
}
