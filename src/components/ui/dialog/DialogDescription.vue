<script setup lang="ts">
import { DialogDescription } from 'reka-ui'

defineSlots<{
  default: () => unknown
}>()
</script>

<template>
  <DialogDescription data-slot="dialog-description" class="text-sm text-muted-foreground">
    <slot />
  </DialogDescription>
</template>
