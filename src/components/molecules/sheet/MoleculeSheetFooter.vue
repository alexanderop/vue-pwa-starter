<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * Column-reversed below `sm`, for the same reason `MoleculeDialogFooter` is:
 * one DOM order — dismissive first, confirming second — reads correctly as a
 * right-aligned row on a wide screen and as a stack with the way out closest
 * to the thumb on a narrow one.
 */
const props = defineProps<{ class?: HTMLAttributes['class'] }>()

defineSlots<{
  default: () => unknown
}>()
</script>

<template>
  <div
    data-slot="sheet-footer"
    :class="
      cn('flex shrink-0 flex-col-reverse gap-2 px-gutter sm:flex-row sm:justify-end', props.class)
    "
  >
    <slot />
  </div>
</template>
