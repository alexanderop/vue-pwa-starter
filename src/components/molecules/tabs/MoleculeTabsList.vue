<script setup lang="ts">
import type { TabsListProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TabsList, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

/**
 * The strip. It scrolls horizontally rather than wrapping or shrinking,
 * because a phone runs out of width long before it runs out of tabs, and a
 * strip that wraps to two rows changes the height of everything under it.
 *
 * `overscroll-x-contain` keeps a horizontal fling from turning into a page
 * back-navigation, and the scrollbar is hidden because a touch surface does
 * not need one.
 */
const props = defineProps<TabsListProps & { class?: HTMLAttributes['class'] }>()

const forwarded = useForwardProps(reactiveOmit(props, 'class'))

defineSlots<{
  default: () => unknown
}>()
</script>

<template>
  <TabsList
    data-slot="tabs-list"
    v-bind="forwarded"
    :class="
      cn(
        'flex shrink-0 gap-1 overflow-x-auto overscroll-x-contain border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        props.class,
      )
    "
  >
    <slot />
  </TabsList>
</template>
