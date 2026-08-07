<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import NoteCard from '@/features/notes/components/NoteCard.vue'
import { useNotesStore } from '@/features/notes/useNotesStore'
import { useToastStore } from '@/stores/toast'

const { t } = useI18n()
const notesStore = useNotesStore()
const toast = useToastStore()

onMounted(() => {
  void notesStore.load()
})

async function handleDelete(id: string): Promise<void> {
  await notesStore.remove(id)
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
          @toggle-pinned="notesStore.togglePinned(note)"
          @delete="handleDelete(note.id)"
        />
      </li>
    </ul>
  </div>
</template>
