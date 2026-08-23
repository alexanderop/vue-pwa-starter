<script setup lang="ts">
import type { TabsTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TabsTrigger, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

/**
 * One tab. `shrink-0` and `whitespace-nowrap` are what make the list scroll
 * instead of squeezing every label into two illegible characters, and the
 * 44px floor applies here like everywhere else.
 *
 * The selected state is drawn from `data-[state=active]`, which Reka sets on
 * the same element it marks `aria-selected` — one source, so the underline and
 * the announcement cannot disagree.
 */
const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes['class'] }>()

const forwarded = useForwardProps(reactiveOmit(props, 'class'))

defineSlots<{
  default: () => unknown
}>()
</script>

<template>
  <TabsTrigger
    data-slot="tabs-trigger"
    v-bind="forwarded"
    :class="
      cn(
        'inline-flex min-h-touch-target shrink-0 items-center justify-center gap-2 border-b-2 border-transparent px-4 py-2 text-label whitespace-nowrap text-muted-foreground select-none touch-manipulation transition-[color,border-color] duration-(--duration-fast) hover:text-foreground active:text-foreground focus-ring-inset disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-primary data-[state=active]:text-primary',
        props.class,
      )
    "
  >
    <slot />
  </TabsTrigger>
</template>
