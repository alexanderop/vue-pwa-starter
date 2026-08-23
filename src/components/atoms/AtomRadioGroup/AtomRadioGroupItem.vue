<script setup lang="ts">
import type { RadioGroupItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { RadioGroupIndicator, RadioGroupItem, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

/**
 * One option. The indicator is a filled dot rather than an icon, because a
 * radio is the one control whose shape is its meaning: round is "one of
 * these", square is "any of these", and swapping them makes a form lie.
 */
const props = defineProps<RadioGroupItemProps & { class?: HTMLAttributes['class'] }>()

const forwarded = useForwardProps(reactiveOmit(props, 'class'))
</script>

<template>
  <RadioGroupItem
    data-slot="radio-group-item"
    v-bind="forwarded"
    :class="
      cn(
        'aspect-square size-5 shrink-0 rounded-full border border-input text-primary shadow-raised transition-colors duration-(--duration-fast) touch-manipulation focus-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary',
        props.class,
      )
    "
  >
    <RadioGroupIndicator
      data-slot="radio-group-indicator"
      class="flex size-full items-center justify-center"
    >
      <span class="size-2.5 rounded-full bg-primary" />
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>
