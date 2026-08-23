<script setup lang="ts">
import type { TabsContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TabsContent, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<TabsContentProps & { class?: HTMLAttributes['class'] }>()

const forwarded = useForwardProps(reactiveOmit(props, 'class'))

defineSlots<{
  default: () => unknown
}>()
</script>

<template>
  <TabsContent
    data-slot="tabs-content"
    v-bind="forwarded"
    :class="cn('focus-visible:outline-hidden', props.class)"
  >
    <slot />
  </TabsContent>
</template>
