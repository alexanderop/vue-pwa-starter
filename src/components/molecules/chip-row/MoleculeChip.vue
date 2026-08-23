<script setup lang="ts">
import type { ToggleEmits, ToggleProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { Toggle, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

/**
 * One filter chip — a toggle, not a tab.
 *
 * The difference is `aria-pressed` versus `aria-selected`, and it is not
 * cosmetic: a chip row is a set of independent on/off filters, so each chip
 * announces its own pressed state and any number can be on. A tab strip
 * announces one selection out of a set. Rendering filters as tabs tells a
 * screen-reader user that turning one on turned another off.
 *
 * `snap-start` and `shrink-0` belong here rather than on the row: the chip is
 * the thing that snaps, and a chip that shrinks to fit is a chip whose label
 * is unreadable at the exact moment the row overflows.
 */
const props = defineProps<ToggleProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<ToggleEmits>()

defineSlots<{
  default: () => unknown
}>()

const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class'), emits)
</script>

<template>
  <Toggle
    data-slot="chip"
    v-bind="forwarded"
    :class="
      cn(
        'inline-flex min-h-touch-target shrink-0 snap-start items-center gap-2 rounded-full border px-4 text-label whitespace-nowrap transition-[color,background-color,border-color,scale] duration-(--duration-fast) select-none touch-manipulation active:scale-[0.97] hover:bg-accent focus-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90',
        props.class,
      )
    "
  >
    <slot />
  </Toggle>
</template>
