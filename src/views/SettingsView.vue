<script setup lang="ts">
import { ChevronLeft, Download, Smartphone, Upload } from '@lucide/vue'
import { Effect } from 'effect'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import TemplatePageLayout from '@/components/templates/TemplatePageLayout.vue'
import OrganismPwaInstallDialog from '@/components/organisms/OrganismPwaInstallDialog.vue'
import { MoleculeList, MoleculeListRow, MoleculeListSection } from '@/components/molecules/list'
import AtomLabel from '@/components/atoms/AtomLabel.vue'
import AtomSelect from '@/components/atoms/AtomSelect.vue'
import AtomSpinner from '@/components/atoms/AtomSpinner.vue'
import AtomSwitch from '@/components/atoms/AtomSwitch.vue'
import { useAtomSet } from '@effect/atom-vue'
import { useInstallPrompt } from '@/composables/useInstallPrompt'
import { useLocale } from '@/composables/useLocale'
import { useReportFailure } from '@/composables/useReportFailure'
import { useTheme } from '@/composables/useTheme'
import { dbMutation, exportData, importData, runDb } from '@/db'
import type { SupportedLocale } from '@/i18n'
import { downloadBackup, readBackupFile } from '@/lib/backupFile'
import { useToastStore } from '@/stores/toast'

const { t } = useI18n()
const { isDark } = useTheme()
const { locale, setLocale, supportedLocales } = useLocale()
const toast = useToastStore()

// The way back in after "Not now" — a dismissed hint is persisted forever, so
// without this the install path would be a one-time offer.
const { canInstall, isInstalled } = useInstallPrompt()
const installDialogOpen = ref(false)

// Import writes rows, so it runs through the mutation atom: when the program
// lands, the notes read atoms are invalidated and re-read the imported data
// — no manual store reload. Export only reads, so it stays on `runDb`.
const runMutation = useAtomSet(() => dbMutation, { mode: 'promise' })

// The shared failure branch: a structured log for the developer, a toast for
// the user — see useReportFailure for why it is an Effect.
const reportFailure = useReportFailure('settings')

/**
 * Every language is offered in its own name ("Deutsch", never "German"), so
 * the label is read from that locale's catalog instead of the active one —
 * one `nativeName` key per catalog, which a new locale brings with it.
 */
function localeName(code: SupportedLocale): string {
  return t('settings.language.nativeName', {}, { locale: code })
}

function handleLocaleChange(value: string): void {
  // SAFETY: `setLocale` re-checks the value against SUPPORTED_LOCALES and
  // falls back to the default, so this narrows the argument type without
  // claiming the string has been validated. AtomSelect's model is a plain
  // string — the options it was given are this component's business, not the
  // primitive's.
  setLocale(value as SupportedLocale)
}

/**
 * Whether a backup is in flight, per direction rather than shared: two
 * buttons sit side by side, and one flag would spin the one the user did not
 * tap. A full database read and a `readAsText` over a large backup are both
 * long enough to look like nothing happened — which, in a local-first app, is
 * indistinguishable from the export silently failing.
 */
const exporting = ref(false)
const importing = ref(false)

/**
 * Reading the database and handing the file to the browser are two steps that
 * can each fail, so both are programs and the recovery is written once. A
 * backup the user believes they saved and did not is the worst outcome in a
 * local-first app, so the failure is never silent.
 *
 * The runDb promise is returned to Vue: with every failure caught by tag, a
 * rejection can only be a defect, and Vue routes it to
 * `app.config.errorHandler` — but only for promises it is handed. `.finally`
 * rather than a `try`/`finally` around an `await` keeps that handover intact:
 * it clears the flag and passes the same settled promise on.
 */
function handleExport(): Promise<void> {
  const failed = reportFailure('export backup', t('settings.data.exportError'))
  exporting.value = true

  return runDb(
    exportData.pipe(
      Effect.flatMap(downloadBackup),
      Effect.catchTags({ 'Db.DatabaseError': failed, 'BackupFile.BackupFileError': failed }),
    ),
  ).finally(() => {
    exporting.value = false
  })
}

const fileInput = ref<HTMLInputElement | null>(null)

async function handleImportFile(event: Event): Promise<void> {
  // SAFETY: bound to `<input type="file">`'s own change event in this
  // component's template, so the target is that input.
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const failed = reportFailure('import backup', t('settings.data.importError'))
  importing.value = true

  // Read the file, validate it as a backup, write it — one program, three
  // distinct ways to fail, matched by tag: a payload that is not a backup
  // gets its own message, an unreadable file or a failed write stays generic.
  // A tag left out of `catchTags` stays in the error channel, so adding a
  // fourth failure to the pipeline breaks the build at `runMutation` until it
  // is handled here.
  await runMutation(
    readBackupFile(file).pipe(
      Effect.flatMap(importData),
      Effect.tap(() => Effect.sync(() => toast.showToast(t('settings.data.importSuccess')))),
      Effect.catchTags({
        'Db.BackupInvalidError': reportFailure('import backup', t('settings.data.invalidBackup')),
        'BackupFile.BackupFileError': failed,
        'Db.DatabaseError': failed,
      }),
    ),
  ).finally(() => {
    importing.value = false
  })
}
</script>

<template>
  <TemplatePageLayout :title="t('settings.title')" :show-back="false">
    <!-- Rows, not a page of bordered boxes. Every group here is the same
         shape — a heading and some settings — and it was being spelled out
         four times with slightly different padding each time. -->
    <div class="mx-auto flex w-full max-w-lg flex-col gap-section p-gutter">
      <MoleculeListSection>
        <template #heading>
          <h2 class="text-section-title font-semibold">{{ t('settings.appearance.title') }}</h2>
        </template>
        <MoleculeList>
          <MoleculeListRow>
            <AtomLabel for="dark-mode-switch">{{ t('settings.appearance.darkMode') }}</AtomLabel>
            <template #trailing><AtomSwitch id="dark-mode-switch" v-model="isDark" /></template>
          </MoleculeListRow>
        </MoleculeList>
      </MoleculeListSection>

      <MoleculeListSection>
        <template #heading>
          <h2 class="text-section-title font-semibold">{{ t('settings.language.title') }}</h2>
        </template>
        <MoleculeList>
          <!-- The select is the row's trailing control rather than a field
               under a label, so the row keeps the 44px height every other one
               has. `for`/`id` still ties them together; the label being the
               row title is what makes that honest. -->
          <MoleculeListRow>
            <AtomLabel for="locale-select">{{ t('settings.language.label') }}</AtomLabel>
            <template #trailing>
              <AtomSelect
                id="locale-select"
                class="w-auto"
                :model-value="locale"
                @update:model-value="handleLocaleChange"
              >
                <option v-for="code in supportedLocales" :key="code" :value="code">
                  {{ localeName(code) }}
                </option>
              </AtomSelect>
            </template>
          </MoleculeListRow>
        </MoleculeList>
      </MoleculeListSection>

      <!-- Nothing to offer a browser that cannot install and is not installed
           — an "install" row that leads to no instructions is worse than no
           row at all. -->
      <MoleculeListSection v-if="canInstall || isInstalled">
        <!-- Section-level prose stays at section level. Inside the row it
             would join the button's accessible name, and "How to install Add
             this app to your home screen for offline access." is a sentence,
             not the name of a control. -->
        <template #heading>
          <div>
            <h2 class="text-section-title font-semibold">{{ t('pwa.install.settings.title') }}</h2>
            <p v-if="!isInstalled" class="mt-1 text-footnote text-muted-foreground">
              {{ t('pwa.install.settings.description') }}
            </p>
          </div>
        </template>
        <MoleculeList>
          <MoleculeListRow v-if="isInstalled">
            {{ t('pwa.install.settings.installed') }}
          </MoleculeListRow>
          <MoleculeListRow v-else as="button" type="button" @click="installDialogOpen = true">
            <template #leading><Smartphone class="size-5" aria-hidden="true" /></template>
            {{ t('pwa.install.settings.action') }}
            <template #trailing>
              <ChevronLeft class="size-4 rotate-180" aria-hidden="true" />
            </template>
          </MoleculeListRow>
        </MoleculeList>
      </MoleculeListSection>

      <MoleculeListSection>
        <template #heading>
          <div>
            <h2 class="text-section-title font-semibold">{{ t('settings.data.title') }}</h2>
            <p class="mt-1 text-footnote text-muted-foreground">
              {{ t('settings.data.description') }}
            </p>
          </div>
        </template>
        <MoleculeList>
          <MoleculeListRow as="button" type="button" :disabled="exporting" @click="handleExport">
            <template #leading>
              <AtomSpinner v-if="exporting" class="size-5" />
              <Download v-else class="size-5" aria-hidden="true" />
            </template>
            {{ t('settings.data.export') }}
          </MoleculeListRow>
          <MoleculeListRow
            as="button"
            type="button"
            :disabled="importing"
            @click="fileInput?.click()"
          >
            <template #leading>
              <AtomSpinner v-if="importing" class="size-5" />
              <Upload v-else class="size-5" aria-hidden="true" />
            </template>
            {{ t('settings.data.import') }}
          </MoleculeListRow>
        </MoleculeList>
        <!-- eslint-disable-next-line vue/no-restricted-html-elements -- AtomInput is a `defineModel<string>` text field; a file input has no string value to bind and this one is `hidden` anyway, driven entirely by the row above it. There is nothing here for the primitive to style. -->
        <input
          ref="fileInput"
          type="file"
          accept="application/json"
          class="hidden"
          @change="handleImportFile"
        />
      </MoleculeListSection>
    </div>

    <OrganismPwaInstallDialog v-model:open="installDialogOpen" />
  </TemplatePageLayout>
</template>
