<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * Column-reversed on small viewports, so one DOM order — dismissive first,
 * confirming second — reads correctly in both layouts: a right-aligned row
 * from `sm:` up with the confirming action last, and a stack below `sm` with
 * the confirming action *first* and the way out closest to the thumb. That is
 * the iOS action-sheet order, and it is what puts the escape hatch where a
 * mis-aimed thumb lands.
 *
 * `Components/Molecules/Dialog` grades both halves: `DestructiveConfirmation`
 * at the mobile width the catalog opens at, `DestructiveConfirmationWide`
 * pinned to desktop.
 */
const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

defineSlots<{
  default: () => unknown
}>()
</script>

<template>
  <div
    data-slot="dialog-footer"
    :class="cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', props.class)"
  >
    <slot />
  </div>
</template>
