<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogRoot, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToastStore } from '@/stores/toast'
import { useNotesStore } from '../useNotesStore'

const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const notesStore = useNotesStore()
const toast = useToastStore()

const title = ref('')
const body = ref('')
// In-flight guard: a double-tap on Save would otherwise run save() twice and
// create two identical notes before the first write resolves.
const isSaving = ref(false)
const canSave = computed(() => title.value.trim().length > 0 && !isSaving.value)

// The draft deliberately survives a dismissal — an accidental tap on the
// overlay must not destroy what the user typed. It is cleared only after a
// write actually lands.
async function save(): Promise<void> {
  if (!canSave.value) return
  isSaving.value = true
  try {
    await notesStore.add({ title: title.value.trim(), body: body.value.trim() })
  } catch (error) {
    // Storage can genuinely fail (quota exceeded, private browsing). Keep the
    // sheet and the draft open, and never fail silently.
    console.error('[notes] saving the note failed', error)
    toast.showToast(t('notes.toast.saveFailed'))
    return
  } finally {
    isSaving.value = false
  }

  title.value = ''
  body.value = ''
  // The sheet closes itself, so confirm the save through a toast.
  toast.showToast(t('notes.toast.created'))
  open.value = false
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <MobileDialogContent>
      <DialogTitle>{{ t('notes.form.heading') }}</DialogTitle>
      <DialogDescription>{{ t('notes.form.description') }}</DialogDescription>
      <form class="flex flex-col gap-4" @submit.prevent="save">
        <div class="flex flex-col gap-2">
          <Label for="note-title">{{ t('notes.form.titleLabel') }}</Label>
          <Input id="note-title" v-model="title" :placeholder="t('notes.form.titlePlaceholder')" />
        </div>
        <div class="flex flex-col gap-2">
          <Label for="note-body">{{ t('notes.form.bodyLabel') }}</Label>
          <Textarea id="note-body" v-model="body" :placeholder="t('notes.form.bodyPlaceholder')" />
        </div>
        <Button type="submit" :disabled="!canSave">{{ t('common.buttons.save') }}</Button>
      </form>
    </MobileDialogContent>
  </DialogRoot>
</template>
