<script setup lang="ts">
import { DrawerClose } from 'reka-ui'

/**
 * A pass-through. No `defineProps` and no `v-bind`: this part paints nothing
 * and declares no `class`, so undeclared attributes already fall through onto
 * the single root and arrive at DrawerClose as props. Declaring them only to
 * re-bind them reproduces the default with extra steps.
 */
defineSlots<{
  default: () => unknown
}>()
</script>

<template>
  <DrawerClose data-slot="sheet-close">
    <slot />
  </DrawerClose>
</template>
