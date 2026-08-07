<script setup lang="ts">
import { Effect } from 'effect'
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { runDb } from '@/db'
import { useReportFailure } from '@/composables/useReportFailure'
import NoteCard from '@/features/notes/components/NoteCard.vue'
import { useNotesStore } from '@/features/notes/useNotesStore'
import { useToastStore } from '@/stores/toast'

const { t } = useI18n()
const notesStore = useNotesStore()
const toast = useToastStore()

// The shared failure branch: a structured log for the developer, a toast for
// the user — see useReportFailure for why it is an Effect.
const reportFailure = useReportFailure('notes')

// Storage genuinely fails in the wild (quota exceeded, Firefox private
// browsing). Each handler recovers from that inside Effect, which is what
// leaves `never` in the error channel — the only thing runDb accepts. An
// unhandled DatabaseError here is a type error, not a silent empty list.
//
// Every handler returns the runDb promise to Vue: with the failures already
// caught by tag, a rejection can only be a defect, and Vue routes it to
// `app.config.errorHandler` — but only for promises it is handed.
onMounted(() =>
  runDb(
    notesStore
      .load()
      .pipe(
        Effect.catchTag(
          'Db.DatabaseError',
          reportFailure('load notes', t('notes.toast.loadFailed')),
        ),
      ),
  ),
)

function handleTogglePinned(id: string): Promise<void> {
  return runDb(
    notesStore
      .togglePinned(id)
      .pipe(
        Effect.catchTag(
          'Db.DatabaseError',
          reportFailure('toggle pinned', t('notes.toast.pinFailed')),
        ),
      ),
  )
}

function handleDelete(id: string): Promise<void> {
  return runDb(
    notesStore.remove(id).pipe(
      // Only a delete that landed is confirmed — the tap runs on the success
      // branch alone, so the catch below cannot double up on it.
      Effect.tap(() => Effect.sync(() => toast.showToast(t('notes.toast.deleted')))),
      Effect.catchTag(
        'Db.DatabaseError',
        reportFailure('delete note', t('notes.toast.deleteFailed')),
      ),
    ),
  )
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
