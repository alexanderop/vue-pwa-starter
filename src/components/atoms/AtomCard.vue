<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'

/**
 * The surface that owns `--elevation-raised`.
 *
 * One element and no header/body/footer parts: a card in this app is a box
 * with a background, a border and one rung of depth, and everything inside it
 * is the call site's composition. Splitting it into parts would be inventing
 * structure nobody asked for — `MoleculeList` is the component for when the
 * contents *do* have a shape.
 *
 * `as` exists because a card is often a link or a button. When it is, the call
 * site adds the press and focus styling it needs; this atom deliberately does
 * not guess, because a card that dims under a thumb it will not respond to is
 * the affordance-without-a-wire mistake.
 */
const props = withDefaults(defineProps<PrimitiveProps & { class?: HTMLAttributes['class'] }>(), {
  as: 'div',
})

defineSlots<{
  default: () => unknown
}>()
</script>

<template>
  <Primitive
    data-slot="card"
    :as="props.as"
    :as-child="props.asChild"
    :class="cn('rounded-lg border bg-card p-4 text-card-foreground shadow-raised', props.class)"
  >
    <slot />
  </Primitive>
</template>
