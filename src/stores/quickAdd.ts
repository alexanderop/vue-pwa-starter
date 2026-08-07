import { createGlobalState } from '@vueuse/core'
import { reactive, ref } from 'vue'

/**
 * Global state for the quick-add bottom sheet opened from the nav's center
 * "+" button. Lives in a store (not view-local state) because the trigger
 * sits in the AppShell's center-action slot while the sheet itself is
 * mounted once in App.vue, outside any route view.
 */
export const useQuickAddStore = createGlobalState(() => {
  const isOpen = ref(false)
  // Stays true after the first open so App.vue can defer mounting the sheet
  // (and its dialog machinery) until it's actually needed, keeping app
  // startup lean.
  const hasOpened = ref(false)

  function open(): void {
    isOpen.value = true
    hasOpened.value = true
  }

  function close(): void {
    isOpen.value = false
  }

  function $reset(): void {
    isOpen.value = false
    hasOpened.value = false
  }

  return reactive({
    isOpen,
    hasOpened,
    open,
    close,
    $reset,
  })
})
