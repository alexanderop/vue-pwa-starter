<script setup lang="ts">
import { X } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { usePwaUpdate } from '@/composables/usePwaUpdate'

/**
 * "Update available" banner for the prompt-style service worker flow.
 * Sits above the bottom navigation so it never covers the tabs.
 */
const { t } = useI18n()
const { needRefresh, reload, dismiss } = usePwaUpdate()
</script>

<template>
  <div
    v-if="needRefresh"
    role="status"
    class="fixed inset-x-4 bottom-24 z-50 flex items-center gap-2 rounded-lg border bg-card p-3 shadow-lg sm:right-6 sm:left-auto sm:max-w-sm"
  >
    <p class="flex-1 text-sm">{{ t('pwa.updateAvailable') }}</p>
    <Button size="sm" @click="reload">{{ t('pwa.reload') }}</Button>
    <Button variant="ghost" size="icon" :aria-label="t('pwa.dismiss')" @click="dismiss">
      <X />
    </Button>
  </div>
</template>
