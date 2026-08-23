<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * The surface a set of rows sits on: one card, hairlines between the rows,
 * `--elevation-raised`.
 *
 * A real `<ul>`, not a `<div role="list">`. The count a screen reader
 * announces — "list, 4 items" — is the thing that makes a settings screen
 * navigable, and it is free here and expensive to bolt on later.
 */
const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

defineSlots<{
  default: () => unknown
}>()
</script>

<template>
  <ul
    data-slot="list"
    :class="
      cn(
        'divide-y divide-border overflow-hidden rounded-lg border bg-card text-card-foreground shadow-raised',
        props.class,
      )
    "
  >
    <slot />
  </ul>
</template>
