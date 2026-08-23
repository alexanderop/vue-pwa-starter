<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()

defineSlots<{
  default: () => unknown
}>()
</script>

<template>
  <div
    data-slot="sheet-header"
    :class="cn('flex shrink-0 flex-col gap-1.5 px-gutter', props.class)"
  >
    <slot />
  </div>
</template>
