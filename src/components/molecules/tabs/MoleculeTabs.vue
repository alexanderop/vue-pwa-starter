<script setup lang="ts">
import type { TabsRootEmits, TabsRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TabsRoot, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

/**
 * Tabs on Reka's `Tabs`: roving focus, arrow-key traversal, Home/End, and the
 * `aria-controls`/`aria-labelledby` pairing between a trigger and its panel.
 *
 * None of that is worth reimplementing, and all of it is what a hand-rolled
 * tab strip silently omits — which is why this is the primitive and the
 * bottom tab *bar* is not. `OrganismBottomNav` is navigation between routes;
 * this is switching between panels of one screen. They look alike and share
 * nothing.
 *
 * A trigger's `value` is baked into the generated element ids, so it has to be
 * identifier-safe: a value with a space in it produces an `aria-controls` that
 * is not a valid IDREF, which is invisible until axe says so. Slugs for
 * `value`, human text in the slot.
 */
const props = defineProps<TabsRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<TabsRootEmits>()

defineSlots<{
  default: () => unknown
}>()

const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class'), emits)
</script>

<template>
  <TabsRoot data-slot="tabs" v-bind="forwarded" :class="cn('flex flex-col gap-4', props.class)">
    <slot />
  </TabsRoot>
</template>
