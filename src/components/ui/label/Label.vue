<script setup lang="ts">
import type { LabelProps } from 'reka-ui'
import { Label } from 'reka-ui'

const props = defineProps<LabelProps>()

defineSlots<{
  default: () => unknown
}>()
</script>

<template>
  <Label
    data-slot="label"
    v-bind="props"
    class="text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
  >
    <slot />
  </Label>
</template>
