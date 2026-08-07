<script setup lang="ts">
import { DialogTitle } from 'reka-ui'

defineSlots<{
  default: () => unknown
}>()
</script>

<template>
  <DialogTitle data-slot="dialog-title" class="text-lg leading-none font-semibold">
    <slot />
  </DialogTitle>
</template>
