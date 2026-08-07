<script setup lang="ts">
import { Pin, PinOff, Trash2 } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import type { Note } from '@/db'

const { note } = defineProps<{ note: Note }>()

const emit = defineEmits<{
  togglePinned: []
  delete: []
}>()

const { t } = useI18n()
</script>

<template>
  <article class="rounded-lg border bg-card p-4 shadow-xs">
    <div class="flex items-start gap-1">
      <div class="min-w-0 flex-1">
        <p v-if="note.pinned" class="text-xs font-medium text-primary">{{ t('notes.pinned') }}</p>
        <h3 class="truncate font-semibold">{{ note.title }}</h3>
        <p
          v-if="note.body"
          class="mt-1 line-clamp-3 text-sm whitespace-pre-line text-muted-foreground"
        >
          {{ note.body }}
        </p>
      </div>
      <!-- Per-row actions carry the note title in their accessible name so
           screen-reader users can tell rows apart. -->
      <Button
        variant="ghost"
        size="icon"
        :aria-label="
          note.pinned
            ? t('notes.actions.unpin', { title: note.title })
            : t('notes.actions.pin', { title: note.title })
        "
        @click="emit('togglePinned')"
      >
        <PinOff v-if="note.pinned" />
        <Pin v-else />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        :aria-label="t('notes.actions.delete', { title: note.title })"
        @click="emit('delete')"
      >
        <Trash2 />
      </Button>
    </div>
  </article>
</template>
