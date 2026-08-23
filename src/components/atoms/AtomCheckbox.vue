<script setup lang="ts">
import type { CheckboxRootEmits, CheckboxRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { Check, Minus } from '@lucide/vue'
import { reactiveOmit } from '@vueuse/core'
import { CheckboxIndicator, CheckboxRoot, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

/**
 * A checkbox, including the third state a native one cannot express in markup.
 *
 * `model-value="indeterminate"` is a real value here, not a DOM property set
 * by script after mount — which is how a native checkbox does it, and why a
 * server-rendered or v-for'd list of them loses the state. Reka keeps it in
 * `aria-checked="mixed"`.
 *
 * Sized 20px with a 44px hit area from the padding on the label a call site
 * wraps it in, not by inflating the box: a checkbox that is physically 44px
 * square looks like a button.
 */
const props = defineProps<CheckboxRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<CheckboxRootEmits>()

const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class'), emits)
</script>

<template>
  <CheckboxRoot
    data-slot="checkbox"
    v-bind="forwarded"
    :class="
      cn(
        'peer size-5 shrink-0 rounded-[4px] border border-input shadow-raised transition-colors duration-(--duration-fast) touch-manipulation focus-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
        props.class,
      )
    "
  >
    <CheckboxIndicator
      data-slot="checkbox-indicator"
      class="flex size-full items-center justify-center text-current"
    >
      <Minus v-if="props.modelValue === 'indeterminate'" class="size-3.5" aria-hidden="true" />
      <Check v-else class="size-3.5" aria-hidden="true" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
