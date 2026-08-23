<script setup lang="ts">
import type { DrawerDescriptionProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DrawerDescription, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<DrawerDescriptionProps & { class?: HTMLAttributes['class'] }>()

defineSlots<{
  default: () => unknown
}>()

const forwarded = useForwardProps(reactiveOmit(props, 'class'))
</script>

<template>
  <DrawerDescription
    data-slot="sheet-description"
    v-bind="forwarded"
    :class="cn('text-footnote text-muted-foreground', props.class)"
  >
    <slot />
  </DrawerDescription>
</template>
