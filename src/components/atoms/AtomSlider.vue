<script setup lang="ts">
import type { SliderRootEmits, SliderRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, useForwardPropsEmits } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

/**
 * A slider whose thumb a thumb can actually hit.
 *
 * The visible thumb is 20px and the touch target is 44px, produced by an
 * `::after` pseudo-element rather than by a bigger circle — see
 * docs/touch-conventions.md. A 20px hit area on a control whose whole purpose
 * is dragging is the most common touch-target failure in a web app, and it is
 * invisible on a desktop mouse.
 *
 * `model-value` is an array because Reka supports multiple thumbs from the
 * same root; a single-value slider passes `[n]`.
 *
 * The accessible name needs care, because `role="slider"` is on the *thumb*
 * and attribute fallthrough puts `aria-label` on the root. A one-thumb slider
 * therefore has its label copied down, so "Font size" names the thing a
 * screen reader actually lands on. A range keeps Reka's own per-thumb names —
 * copying one label onto both would announce two different values as the same
 * control.
 */
const props = defineProps<
  SliderRootProps & {
    class?: HTMLAttributes['class']
    /**
     * Declared rather than left to attribute fallthrough, because fallthrough
     * puts it on the root and `role="slider"` is on the *thumb*. A screen
     * reader lands on the thumb, so that is where the name has to be.
     */
    ariaLabel?: string
  }
>()
const emits = defineEmits<SliderRootEmits>()

const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class', 'ariaLabel'), emits)

const thumbs = computed(() => props.modelValue ?? [0])

/**
 * A range keeps Reka's own per-thumb names ("Minimum", "Maximum"): copying one
 * label onto both would announce two different values as the same control.
 */
const soloThumbLabel = computed(() => (thumbs.value.length === 1 ? props.ariaLabel : undefined))
</script>

<template>
  <SliderRoot
    data-slot="slider"
    v-bind="forwarded"
    :aria-label="props.ariaLabel"
    :class="
      cn(
        'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50',
        props.class,
      )
    "
  >
    <SliderTrack
      data-slot="slider-track"
      class="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary"
    >
      <SliderRange data-slot="slider-range" class="absolute h-full bg-primary" />
    </SliderTrack>
    <SliderThumb
      v-for="(_, index) in thumbs"
      :key="index"
      data-slot="slider-thumb"
      :aria-label="soloThumbLabel"
      class="relative block size-5 rounded-full border-2 border-primary bg-background shadow-floating transition-[box-shadow] duration-(--duration-fast) focus-ring after:absolute after:top-1/2 after:left-1/2 after:size-touch-target after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']"
    />
  </SliderRoot>
</template>
