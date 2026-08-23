<script setup lang="ts">
import { WifiOff } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import MoleculeAlert from '@/components/molecules/MoleculeAlert.vue'
import { useOnline } from '@/composables/useOnline'

/**
 * Says the app is offline, and then says it does not matter.
 *
 * A local-first app going offline is not an error state, and a banner that
 * looks like one teaches the user to distrust a product that is working
 * perfectly. So the tone is `warning` rather than `destructive`, the wording
 * is about where the data is rather than about what failed, and there is no
 * action — because there is nothing for the user to do.
 *
 * It is not a toast. A toast is for something that happened; this is a
 * condition that persists, and it stays on screen exactly as long as the
 * condition does.
 */
const { t } = useI18n()

const isOnline = useOnline()
</script>

<template>
  <Transition
    enter-active-class="transition-[opacity,translate] duration-(--duration-base) ease-standard"
    enter-from-class="opacity-0 -translate-y-2"
    leave-active-class="transition-[opacity,translate] duration-(--duration-fast) ease-standard"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div
      v-if="!isOnline"
      data-slot="offline-banner"
      data-testid="offline-banner"
      class="pointer-events-none fixed inset-x-gutter top-0 z-(--z-floating) safe-area-top"
    >
      <MoleculeAlert tone="warning" class="pointer-events-auto mt-2 shadow-overlay">
        <template #icon><WifiOff class="size-4" aria-hidden="true" /></template>
        {{ t('pwa.offline.body') }}
      </MoleculeAlert>
    </div>
  </Transition>
</template>
