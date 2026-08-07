<script setup lang="ts">
import { Download, Upload } from '@lucide/vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageLayout from '@/components/PageLayout.vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useLocale } from '@/composables/useLocale'
import { useTheme } from '@/composables/useTheme'
import { exportData, importData } from '@/db'
import { useNotesStore } from '@/features/notes/useNotesStore'
import type { SupportedLocale } from '@/i18n'
import { useToastStore } from '@/stores/toast'

const { t } = useI18n()
const { isDark } = useTheme()
const { locale, setLocale, supportedLocales } = useLocale()
const toast = useToastStore()
const notesStore = useNotesStore()

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  de: 'Deutsch',
}

function handleLocaleChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  setLocale(value as SupportedLocale)
}

async function handleExport(): Promise<void> {
  const payload = await exportData()
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `vue-pwa-starter-backup-${payload.exportedAt.slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

const fileInput = ref<HTMLInputElement | null>(null)

async function handleImportFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  try {
    const payload: unknown = JSON.parse(await file.text())
    await importData(payload)
    await notesStore.load()
    toast.showToast(t('settings.data.importSuccess'))
  } catch {
    // Invalid JSON or a file that fails schema validation — never silent.
    toast.showToast(t('settings.data.importError'))
  }
}
</script>

<template>
  <PageLayout :title="t('settings.title')" :show-back="false">
    <div class="mx-auto flex w-full max-w-lg flex-col gap-section p-4">
      <section class="flex flex-col gap-3">
        <h2 class="text-section-title font-semibold">{{ t('settings.appearance.title') }}</h2>
        <div class="flex min-h-touch-target items-center justify-between rounded-lg border p-4">
          <Label for="dark-mode-switch">{{ t('settings.appearance.darkMode') }}</Label>
          <Switch id="dark-mode-switch" v-model="isDark" />
        </div>
      </section>

      <section class="flex flex-col gap-3">
        <h2 class="text-section-title font-semibold">{{ t('settings.language.title') }}</h2>
        <div class="rounded-lg border p-4">
          <label class="flex flex-col gap-2 text-sm font-medium" for="locale-select">
            {{ t('settings.language.label') }}
            <select
              id="locale-select"
              class="h-touch-target rounded-md border border-input bg-transparent px-3 text-base"
              :value="locale"
              @change="handleLocaleChange"
            >
              <option v-for="code in supportedLocales" :key="code" :value="code">
                {{ LOCALE_LABELS[code] }}
              </option>
            </select>
          </label>
        </div>
      </section>

      <section class="flex flex-col gap-3">
        <h2 class="text-section-title font-semibold">{{ t('settings.data.title') }}</h2>
        <div class="flex flex-col gap-4 rounded-lg border p-4">
          <p class="text-sm text-muted-foreground">{{ t('settings.data.description') }}</p>
          <div class="flex flex-wrap gap-2">
            <Button variant="outline" @click="handleExport">
              <Download />
              {{ t('settings.data.export') }}
            </Button>
            <Button variant="outline" @click="fileInput?.click()">
              <Upload />
              {{ t('settings.data.import') }}
            </Button>
            <input
              ref="fileInput"
              type="file"
              accept="application/json"
              class="hidden"
              @change="handleImportFile"
            />
          </div>
        </div>
      </section>
    </div>
  </PageLayout>
</template>
