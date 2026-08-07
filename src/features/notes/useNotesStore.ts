import { createGlobalState } from '@vueuse/core'
import { Effect } from 'effect'
import { reactive, ref } from 'vue'
import type { Note, NoteDraft } from '@/db'
import { createNote, deleteNote, listNotes, toggleNotePinned } from '@/db'
import { sortNotes } from './domain'

/**
 * Feature store via VueUse createGlobalState — not Pinia. For a local-first
 * app this is deliberate: no extra dependency, plain composition-API code,
 * and the same testing story as any other composable. The store is the only
 * writer; every mutation goes through the repository and then re-reads, so
 * the ref always mirrors what is actually persisted.
 *
 * Every method returns an Effect *program* rather than running one. Nothing
 * touches IndexedDB until a component pipes the program through its own
 * failure handling and hands it to `runDb`. That keeps write failures (quota
 * exceeded, private-browsing IndexedDB) in the type as `DatabaseError`
 * instead of as a thrown exception the caller may or may not remember to
 * catch — the UI layer still decides how to present them, but the compiler
 * decides that it must.
 *
 * The methods stay functions rather than plain Effect values on purpose:
 * `reactive()` deep-proxies nested objects, and an Effect handed to it would
 * be wrapped along with its internals. Functions it leaves alone.
 */
export const useNotesStore = createGlobalState(() => {
  const notes = ref<Array<Note>>([])
  const isLoaded = ref(false)

  const load = Effect.fn('notesStore.load')(function* () {
    const stored = yield* listNotes
    notes.value = sortNotes(stored)
    isLoaded.value = true
  })

  const add = Effect.fn('notesStore.add')(function* (draft: NoteDraft) {
    yield* createNote(draft)
    yield* load()
  })

  // Takes an id, not a row: the flip happens against current DB state so a
  // double-tap can't write the same value twice from a stale row.
  const togglePinned = Effect.fn('notesStore.togglePinned')(function* (id: string) {
    yield* toggleNotePinned(id)
    yield* load()
  })

  const remove = Effect.fn('notesStore.remove')(function* (id: string) {
    yield* deleteNote(id)
    yield* load()
  })

  function $reset(): void {
    notes.value = []
    isLoaded.value = false
  }

  return reactive({
    notes,
    isLoaded,
    load,
    add,
    togglePinned,
    remove,
    $reset,
  })
})
