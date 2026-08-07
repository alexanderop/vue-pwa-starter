<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import NoteCard from '@/features/notes/components/NoteCard.vue'
import { useNotesStore } from '@/features/notes/useNotesStore'
import { useToastStore } from '@/stores/toast'

const { t } = useI18n()
const notesStore = useNotesStore()
const toast = useToastStore()

// Returning the promise matters: Vue routes a rejected async lifecycle hook
// through app.config.errorHandler. Without it a Dexie failure (Firefox private
// browsing, for instance) becomes a raw unhandledrejection and the list just
// stays empty.
onMounted(() =>
  notesStore.load().catch((error: unknown) => {
    toast.showToast(t('notes.toast.loadFailed'))
    throw error
  }),
)

// The store rethrows storage failures; presenting them is this layer's job.
async function handleTogglePinned(id: string): Promise<void> {
  try {
    await notesStore.togglePinned(id)
  } catch (error) {
    console.error('[notes] toggling the pin failed', error)
    toast.showToast(t('notes.toast.pinFailed'))
  }
}

async function handleDelete(id: string): Promise<void> {
  try {
    await notesStore.remove(id)
  } catch (error) {
    console.error('[notes] deleting the note failed', error)
    toast.showToast(t('notes.toast.deleteFailed'))
    return
  }
  toast.showToast(t('notes.toast.deleted'))
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-lg flex-col gap-section p-4">
    <h1 class="text-page-title font-bold tracking-tight">{{ t('notes.title') }}</h1>

    <div
      v-if="notesStore.isLoaded && notesStore.notes.length === 0"
      class="rounded-lg border border-dashed p-8 text-center"
    >
      <h2 class="text-section-title font-semibold">{{ t('notes.empty.title') }}</h2>
      <p class="mt-2 text-sm text-muted-foreground">{{ t('notes.empty.body') }}</p>
    </div>

    <ul v-else class="flex list-none flex-col gap-3 p-0">
      <li v-for="note in notesStore.notes" :key="note.id">
        <NoteCard
          :note="note"
          @toggle-pinned="handleTogglePinned(note.id)"
          @delete="handleDelete(note.id)"
        />
      </li>
    </ul>
  </div>
</template>
