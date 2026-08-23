<script setup lang="ts">
import type { SeparatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { Separator, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

/**
 * A rule between things.
 *
 * Reka's `Separator` is here for one attribute: `decorative`. A separator that
 * only groups things visually should be hidden from assistive technology, and
 * one that marks a real boundary should be `role="separator"`. Guessing wrong
 * either adds noise to every screen reader pass or removes a landmark; the
 * primitive makes it a choice.
 */
const props = defineProps<SeparatorProps & { class?: HTMLAttributes['class'] }>()

const forwarded = useForwardProps(reactiveOmit(props, 'class'))
</script>

<template>
  <Separator
    data-slot="separator"
    v-bind="forwarded"
    :class="
      cn(
        'shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        props.class,
      )
    "
  />
</template>
