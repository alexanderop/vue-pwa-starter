<script setup lang="ts">
import type { RadioGroupRootEmits, RadioGroupRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { RadioGroupRoot, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

/**
 * A radio group — compound, because a radio is meaningless alone.
 *
 * Reka supplies the roving tab index (the group is one tab stop, the arrows
 * move within it) and the `role="radiogroup"` wrapper. Both are things a set
 * of `<input type="radio">` gets from the browser only if every one of them
 * shares a `name`, which is exactly the detail a `v-for` gets wrong.
 */
const props = defineProps<RadioGroupRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<RadioGroupRootEmits>()

defineSlots<{
  default: () => unknown
}>()

const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class'), emits)
</script>

<template>
  <RadioGroupRoot data-slot="radio-group" v-bind="forwarded" :class="cn('grid gap-2', props.class)">
    <slot />
  </RadioGroupRoot>
</template>
