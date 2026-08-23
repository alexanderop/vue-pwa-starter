import { useOnline as useVueUseOnline } from '@vueuse/core'
import type { Ref } from 'vue'

/**
 * Whether the browser believes it has a network connection.
 *
 * Wrapped rather than imported directly so the app has one answer to a
 * question with two honest halves: `navigator.onLine === false` is a reliable
 * "definitely offline", while `true` only means "an interface is up" and says
 * nothing about whether anything is reachable. `src/lib/swUpdateCheck.ts`
 * already relies on exactly that asymmetry.
 *
 * That is why this is only ever used to *inform* — the offline banner, a
 * "saved locally" note — and never to gate a write. In a local-first app every
 * write goes to IndexedDB regardless, so there is nothing here to block on.
 *
 * One value, so it returns the ref itself rather than an object holding it.
 * See docs/composables.md.
 */
export function useOnline(): Ref<boolean> {
  return useVueUseOnline()
}
