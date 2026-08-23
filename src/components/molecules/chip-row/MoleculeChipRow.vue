<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * A horizontally scrolling row of filters.
 *
 * Native overflow rather than Reka's `ScrollArea`, deliberately. `ScrollArea`
 * exists to give a custom scrollbar and it replaces the platform's scrolling
 * to do it — which on a phone costs momentum, rubber-banding and the
 * scroll-anchoring the OS provides for free, in exchange for a scrollbar no
 * touch device draws. The one thing it would have bought here is nothing this
 * row needs.
 *
 * `overscroll-x-contain` is the load-bearing class: without it a horizontal
 * fling that reaches the end of the row continues into the browser's
 * back-navigation gesture, and the user loses the screen. `touch-action:
 * pan-x` keeps a mostly-vertical drag scrolling the page instead of being
 * captured here — the "must not trap vertical scroll" half.
 *
 * Scroll snapping is per-chip so a fling always lands with a whole chip at the
 * edge rather than half of one.
 */
const props = defineProps<{ class?: HTMLAttributes['class'] }>()

defineSlots<{
  default: () => unknown
}>()
</script>

<template>
  <div
    data-slot="chip-row"
    role="group"
    :class="
      cn(
        'flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-gutter py-1 [touch-action:pan-x] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
