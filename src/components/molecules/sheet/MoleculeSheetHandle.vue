<script setup lang="ts">
import type { DrawerHandleProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DrawerHandle, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

/**
 * The visible grip. The gesture itself is not here: `DrawerContent` listens
 * for the pointer across its whole surface, so a drag started anywhere on the
 * sheet dismisses it and the bar is the affordance that says so.
 *
 * `DrawerHandle` contributes `aria-hidden` and a `data-state`, which is the
 * right split — the bar is decoration for assistive technology, because the
 * swipe is never the only way out. Escape and the scrim close the sheet too.
 */
const props = defineProps<DrawerHandleProps & { class?: HTMLAttributes['class'] }>()

const forwarded = useForwardProps(reactiveOmit(props, 'class'))
</script>

<template>
  <DrawerHandle
    data-slot="sheet-handle"
    v-bind="forwarded"
    :class="cn('mx-auto my-2 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30', props.class)"
  />
</template>
