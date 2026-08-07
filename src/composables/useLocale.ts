import { useLocalStorage } from '@vueuse/core'
import { watch } from 'vue'
import type { SupportedLocale } from '@/i18n'
import { i18n, SUPPORTED_LOCALES } from '@/i18n'

function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as ReadonlyArray<string>).includes(value)
}

// Module-scoped so every consumer shares one source of truth, and the
// persisted choice is applied exactly once, immediately on first import.
const storedLocale = useLocalStorage<SupportedLocale>('vue-pwa-starter.locale', 'en')

watch(
  storedLocale,
  (value) => {
    // Guard against hand-edited or stale localStorage values.
    i18n.global.locale.value = isSupportedLocale(value) ? value : 'en'
  },
  { immediate: true },
)

export function useLocale() {
  function setLocale(next: SupportedLocale): void {
    storedLocale.value = next
  }

  return {
    locale: storedLocale,
    setLocale,
    supportedLocales: SUPPORTED_LOCALES,
  }
}
