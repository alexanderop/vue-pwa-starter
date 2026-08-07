import { nextTick } from 'vue'
import { resetLocaleState } from '@/composables/useLocale'
import { resetThemeState } from '@/composables/useTheme'
import { resetDatabase } from '@/db'
import { useNotesStore } from '@/features/notes/useNotesStore'
import { useQuickAddStore } from '@/stores/quickAdd'
import { useToastStore } from '@/stores/toast'

/**
 * Full app-state reset for browser-tier tests: database, global stores,
 * persisted preferences, and theme class. Use as `beforeEach(resetAppState)`.
 *
 * `localStorage.clear()` alone is not enough: writes made in the same document
 * fire no storage event, so the module-scoped VueUse refs behind useLocale and
 * useTheme keep their in-memory values and leak into every later test in the
 * file. Each composable therefore exposes its own reset — the `$reset()`
 * convention the stores follow — and those are the source of truth here.
 */
export async function resetAppState(): Promise<void> {
  await resetDatabase()
  useNotesStore().$reset()
  useQuickAddStore().$reset()
  useToastStore().$reset()
  localStorage.clear()
  resetLocaleState()
  resetThemeState()
  // useColorMode applies the `.dark` class from a `flush: 'post'` watcher.
  await nextTick()
}
