<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * A titled group of rows: the heading, then whatever list the call site puts
 * in the default slot.
 *
 * The heading is a slot rather than a `title` string prop, so the call site
 * keeps the heading *level*. A settings screen has one `h1` and several `h2`s;
 * a component that hard-codes `h2` is a component that cannot be nested, and
 * a component that takes a `level` prop is one that will be passed the wrong
 * number.
 */
const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

defineSlots<{
  default: () => unknown
  heading: () => unknown
}>()
</script>

<template>
  <section data-slot="list-section" :class="cn('flex flex-col gap-3', props.class)">
    <slot name="heading" />
    <slot />
  </section>
</template>
