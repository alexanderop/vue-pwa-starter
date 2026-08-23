<script setup lang="ts">
import { DrawerTrigger } from 'reka-ui'

/**
 * A pass-through. No `defineProps` and no `v-bind`: this part paints nothing
 * and declares no `class`, so undeclared attributes already fall through onto
 * the single root and arrive at DrawerTrigger as props. Declaring them only to
 * re-bind them reproduces the default with extra steps.
 */
defineSlots<{
  default: () => unknown
}>()
</script>

<template>
  <DrawerTrigger data-slot="sheet-trigger">
    <slot />
  </DrawerTrigger>
</template>
