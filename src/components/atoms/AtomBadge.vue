<script setup lang="ts">
import type { VariantProps } from 'class-variance-authority'
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'

/**
 * A short status marker: pinned, offline, unsynced, a count. In a local-first
 * app that vocabulary is not decoration — "this is on your device and nowhere
 * else" is a state the UI has to be able to say in one word.
 *
 * A badge is a label, not a control, so nothing here answers a press and the
 * touch floor does not apply. When a badge needs to be tappable it stops
 * being a badge: use `as-child` around an `AtomButton` or a `RouterLink`,
 * which brings the hit area and the press state with it.
 *
 * `[a&]:` in the variants is Tailwind's "when this element is an `<a>`" —
 * the hover states apply only to the `as-child` link form, so a static badge
 * does not light up under a mouse for no reason.
 *
 * That link form does need a press, though, and for a while it did not have
 * one: Tailwind gates `hover:` behind `@media (hover: hover)`, so a badge-link
 * answered a tap with nothing at all on a phone. The base carries
 * `[a&]:active:opacity-80` for it — opacity rather than a scale, because a
 * badge sits inline in a row of text and a scaling one shoves its neighbours.
 * `opacity` is in the transition list for the same reason `scale` has to be
 * named where it is used: a list that does not name the property it animates
 * makes the state snap.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,background-color,opacity] duration-(--duration-fast) [a&]:active:opacity-80 [&>svg]:pointer-events-none [&>svg:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        outline: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type BadgeVariants = VariantProps<typeof badgeVariants>

interface Props extends PrimitiveProps {
  variant?: BadgeVariants['variant']
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  as: 'span',
})

defineSlots<{
  default: () => unknown
}>()
</script>

<template>
  <Primitive
    data-slot="badge"
    :data-variant="props.variant"
    :as="props.as"
    :as-child="props.asChild"
    :class="cn(badgeVariants({ variant: props.variant }), props.class)"
  >
    <slot />
  </Primitive>
</template>
