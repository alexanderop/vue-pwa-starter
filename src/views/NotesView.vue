<script setup lang="ts">
import { NotebookPen } from '@lucide/vue'
import { AsyncResult, useAtomSet, useAtomValue } from '@effect/atom-vue'
import { Effect } from 'effect'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { dbMutation, deleteNote, toggleNotePinned } from '@/db'
import { useReportFailure } from '@/composables/useReportFailure'
import AtomSkeleton from '@/components/atoms/AtomSkeleton.vue'
import MoleculeEmptyState from '@/components/molecules/MoleculeEmptyState.vue'
import NoteCard from '@/features/notes/components/NoteCard.vue'
import { notesAtom } from '@/features/notes/atoms'
import { useToastStore } from '@/stores/toast'

const { t } = useI18n()
const toast = useToastStore()

// Subscribing is the load: the atom reads IndexedDB when the first
// subscriber arrives and re-reads whenever a mutation invalidates it — no
// onMounted, no manual re-read after writes. One AsyncResult carries
// loading, failure, and data; the computeds below name the states the
// template renders. `getOrElse` keeps the previous list visible while a
// refresh is in flight, so the screen never flashes empty between writes.
const notesResult = useAtomValue(() => notesAtom)
const notes = computed(() => AsyncResult.getOrElse(notesResult.value, () => []))
const loadFailed = computed(() => AsyncResult.isFailure(notesResult.value))
const isLoaded = computed(() => AsyncResult.isNotInitial(notesResult.value))

/**
 * How many placeholder cards the loading list shows. Three, because it fills
 * a phone's first screen without pretending to know how many notes are
 * coming — a skeleton list longer than the real one is its own layout shift.
 */
const SKELETON_COUNT = 3

// Storage genuinely fails in the wild (quota exceeded, Firefox private
// browsing). Each handler recovers from that inside Effect, which is what
// leaves `never` in the error channel — the only thing dbMutation accepts.
// An unhandled DatabaseError here is a type error, not a silent no-op.
//
// Every handler hands its mutation promise back to Vue: with the failures
// already caught by tag, a rejection can only be a defect, and Vue routes it
// to `app.config.errorHandler` — but only for promises it is handed. The
// handlers await rather than return, so the contract is `Promise<void>`: the
// atom's success value is nothing a caller reads.
const runMutation = useAtomSet(() => dbMutation, { mode: 'promise' })

// The shared failure branch: a structured log for the developer, a toast for
// the user — see useReportFailure for why it is an Effect.
const reportFailure = useReportFailure('notes')

async function handleTogglePinned(id: string): Promise<void> {
  await runMutation(
    toggleNotePinned(id).pipe(
      Effect.catchTag(
        'Db.DatabaseError',
        reportFailure('toggle pinned', t('notes.toast.pinFailed')),
      ),
    ),
  )
}

async function handleDelete(id: string): Promise<void> {
  await runMutation(
    deleteNote(id).pipe(
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

    <MoleculeEmptyState
      v-if="loadFailed"
      role="alert"
      title-as="h2"
      class="rounded-lg border border-dashed"
    >
      {{ t('notes.loadError') }}
    </MoleculeEmptyState>

    <MoleculeEmptyState
      v-else-if="isLoaded && notes.length === 0"
      title-as="h2"
      class="rounded-lg border border-dashed"
    >
      <template #icon><NotebookPen class="size-6" aria-hidden="true" /></template>
      {{ t('notes.empty.title') }}
      <template #description>{{ t('notes.empty.body') }}</template>
    </MoleculeEmptyState>

    <!-- The first read from IndexedDB, before any note exists to show. It is
         rarely slow and it is never instant, and the alternative is a blank
         column that looks like the empty state for a frame — the one wrong
         answer here, since "you have no notes" and "your notes are loading"
         are different sentences. Card-shaped rather than a bar, so the list
         does not jump when the real cards land.

         `aria-busy` carries the state once, on the region that owns it: the
         placeholders inside are aria-hidden, because eight announcements of
         nothing is worse than none. -->
    <ul
      v-else-if="!isLoaded"
      aria-busy="true"
      :aria-label="t('notes.title')"
      class="flex list-none flex-col gap-3 p-0"
    >
      <li v-for="placeholder in SKELETON_COUNT" :key="placeholder">
        <AtomSkeleton class="h-24 rounded-lg" />
      </li>
    </ul>

    <ul v-else class="flex list-none flex-col gap-3 p-0">
      <li v-for="note in notes" :key="note.id">
        <NoteCard
          :note="note"
          @toggle-pinned="handleTogglePinned(note.id)"
          @delete="handleDelete(note.id)"
        />
      </li>
    </ul>
  </div>
</template>
