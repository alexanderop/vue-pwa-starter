<script setup lang="ts">
import type { ProgressRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ProgressIndicator, ProgressRoot, useForwardProps } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

/**
 * A determinate or indeterminate progress bar.
 *
 * `model-value` of `null` is indeterminate, and it is a different promise from
 * `0`: "this is happening and I cannot say how far along" rather than "this
 * has not started". Reka carries that distinction into `aria-valuenow`, which
 * is the whole reason not to draw two divs by hand.
 *
 * The indicator is translated rather than width-animated: `transform` is
 * composited and `width` is not, and a progress bar that reflows its parent on
 * every frame is the one thing a progress bar must not do.
 */
const props = defineProps<ProgressRootProps & { class?: HTMLAttributes['class'] }>()

const forwarded = useForwardProps(reactiveOmit(props, 'class'))

/**
 * How far the bar is pulled back from full, as a percentage. An indeterminate
 * bar has no value, so it sits at zero and Reka's `data-state` drives the
 * animation instead.
 */
const emptyPercent = computed(() => 100 - ((props.modelValue ?? 0) / (props.max ?? 100)) * 100)
</script>

<template>
  <ProgressRoot
    data-slot="progress"
    v-bind="forwarded"
    :class="cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', props.class)"
  >
    <ProgressIndicator
      data-slot="progress-indicator"
      class="size-full flex-1 bg-primary transition-transform duration-(--duration-base) ease-standard data-[state=indeterminate]:animate-pulse"
      :style="{
        transform: `translateX(-${emptyPercent}%)`,
      }"
    />
  </ProgressRoot>
</template>
