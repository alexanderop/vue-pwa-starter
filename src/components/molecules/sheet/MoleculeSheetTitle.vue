<script setup lang="ts">
import type { DrawerTitleProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DrawerTitle, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<DrawerTitleProps & { class?: HTMLAttributes['class'] }>()

defineSlots<{
  default: () => unknown
}>()

const forwarded = useForwardProps(reactiveOmit(props, 'class'))
</script>

<template>
  <DrawerTitle
    data-slot="sheet-title"
    v-bind="forwarded"
    :class="cn('text-section-title font-semibold', props.class)"
  >
    <slot />
  </DrawerTitle>
</template>
