import { createGlobalState } from '@vueuse/core'
import { reactive, ref } from 'vue'
import type { Note, NoteDraft } from '@/db'
import { createNote, deleteNote, listNotes, updateNote } from '@/db'
import { sortNotes } from './domain'

/**
 * Feature store via VueUse createGlobalState — not Pinia. For a local-first
 * app this is deliberate: no extra dependency, plain composition-API code,
 * and the same testing story as any other composable. The store is the only
 * writer; every mutation goes through the repository and then re-reads, so
 * the ref always mirrors what is actually persisted.
 */
export const useNotesStore = createGlobalState(() => {
  const notes = ref<Array<Note>>([])
  const isLoaded = ref(false)

  async function load(): Promise<void> {
    notes.value = sortNotes(await listNotes())
    isLoaded.value = true
  }

  async function add(draft: NoteDraft): Promise<void> {
    await createNote(draft)
    await load()
  }

  async function togglePinned(note: Note): Promise<void> {
    await updateNote(note.id, { pinned: !note.pinned })
    await load()
  }

  async function remove(id: string): Promise<void> {
    await deleteNote(id)
    await load()
  }

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
