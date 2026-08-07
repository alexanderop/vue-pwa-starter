import { createGlobalState } from '@vueuse/core'
import { reactive, ref } from 'vue'

export type ToastMessage = {
  id: string
  message: string
}

const DEFAULT_TOAST_DURATION_MS = 3000

/**
 * Lightweight global toast store for ephemeral confirmation messages,
 * rendered by ToastViewport.vue (mounted once in App.vue).
 *
 * Use this for "never-silent" confirmations after an action that has no
 * other visible feedback (e.g. saving from a sheet that then closes itself).
 */
export const useToastStore = createGlobalState(() => {
  const toasts = ref<Array<ToastMessage>>([])

  function showToast(message: string, durationMs = DEFAULT_TOAST_DURATION_MS): void {
    const id = crypto.randomUUID()
    toasts.value = [...toasts.value, { id, message }]

    setTimeout(() => {
      dismissToast(id)
    }, durationMs)
  }

  function dismissToast(id: string): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function $reset(): void {
    toasts.value = []
  }

  return reactive({
    toasts,
    showToast,
    dismissToast,
    $reset,
  })
})
