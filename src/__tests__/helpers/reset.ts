import { resetDatabase } from '@/db'
import { useNotesStore } from '@/features/notes/useNotesStore'
import { i18n } from '@/i18n'
import { useQuickAddStore } from '@/stores/quickAdd'
import { useToastStore } from '@/stores/toast'

/**
 * Full app-state reset for browser-tier tests: database, global stores,
 * persisted preferences, and theme class. Use as `beforeEach(resetAppState)`.
 */
export async function resetAppState(): Promise<void> {
  await resetDatabase()
  useNotesStore().$reset()
  useQuickAddStore().$reset()
  useToastStore().$reset()
  localStorage.clear()
  i18n.global.locale.value = 'en'
  document.documentElement.classList.remove('dark')
}
