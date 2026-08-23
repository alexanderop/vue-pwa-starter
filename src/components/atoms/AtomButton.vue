<script setup lang="ts">
import type { VariantProps } from 'class-variance-authority'
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'
import { Primitive } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

/**
 * The base answers a tap, which `hover:` cannot: Tailwind v4 gates every
 * `hover:` behind `@media (hover: hover)`, so on a phone the variant styles
 * below never fire at all and a press used to produce nothing.
 *
 * Three things ride along with the press transform, and none are optional:
 * `transition-colors` cannot animate the press, so the property list widens;
 * `touch-manipulation` drops the ~300ms double-tap-zoom wait; `select-none`
 * stops a long-press turning a button label into a text selection.
 *
 * The list names `scale`, **not** `transform`. Tailwind v4 compiles
 * `scale-[0.97]` to the standalone `scale` property rather than to a
 * `transform: scale(…)`, so a list naming `transform` animates a property
 * that never changes and the press snaps. (`transition-transform` would work
 * — it expands to `transform, translate, scale, rotate` — but an explicit
 * list has to say `scale` itself.) Verified in a browser, not reasoned about.
 *
 * Sizing is written **touch-first and collapsed for a fine pointer**, so the
 * 44px floor is the default and shrinking is the exception a mouse opts into.
 * `pointer-fine:` compiles natively in Tailwind 4 — no config, no
 * `@custom-variant`. See docs/touch-conventions.md.
 *
 * Type size and the icon-sizing rule live in `size`, not in the base. They
 * used to be in the base, and that is what made a nav tab impossible to
 * express: `[&_svg:not([class*='size-'])]:size-4` is an arbitrary variant, so
 * tailwind-merge cannot resolve it away, and a 24px lucide icon — which sets
 * its size as an *attribute* — was shrunk to 16px by a rule the call site had
 * no way to lose. A `size` that never names the rule is the only way to not
 * have it, which is why the shell carried two `eslint-disable` comments for it
 * instead.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md select-none touch-manipulation transition-[color,background-color,box-shadow,scale] duration-(--duration-instant) active:scale-[0.97] focus-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-raised hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground shadow-raised hover:bg-secondary/80',
        outline: 'border bg-background shadow-raised hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive:
          'bg-destructive text-destructive-foreground shadow-raised hover:bg-destructive/90',
        /**
         * A tab in the bottom bar: a full-width column with the icon over the
         * label, no pill, and a top rule when it is the current page.
         *
         * The active state is keyed off `aria-current="page"` rather than a
         * second prop, so a tab cannot look selected without announcing that
         * it is. There is no way to get the highlight and skip the semantics.
         *
         * The press is deeper than the pill's and rides on its own transition
         * list — a tab has no background or shadow to animate, and the list
         * has to name `scale` itself or the press snaps.
         */
        nav: 'flex-col gap-0 rounded-none text-muted-foreground transition-[color,scale] hover:text-foreground active:scale-90 aria-[current=page]:border-t-2 aria-[current=page]:border-primary aria-[current=page]:text-primary',
      },
      size: {
        default:
          "h-touch-target px-4 py-2 text-label pointer-fine:h-10 [&_svg:not([class*='size-'])]:size-4",
        sm: "h-10 rounded-md px-3 text-label pointer-fine:h-9 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-12 rounded-md px-6 text-label pointer-fine:h-11 [&_svg:not([class*='size-'])]:size-4",
        icon: "size-touch-target text-label pointer-fine:size-10 [&_svg:not([class*='size-'])]:size-4",
        /**
         * Geometry only, and deliberately no `pointer-fine:` collapse and no
         * svg rule: a tab bar is a touch surface whatever the pointer is, and
         * its icon carries its own size.
         */
        nav: 'min-h-touch-target flex-1 px-2 py-3 text-caption',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonVariants = VariantProps<typeof buttonVariants>

interface Props extends PrimitiveProps {
  variant?: ButtonVariants['variant']
  /**
   * `nav` is deliberately not offerable here — it is the geometry half of the
   * `nav` *variant* and is supplied below. Leaving it in the public union made
   * `variant="default" size="nav"` valid, which is exactly the half-applied
   * pairing the resolution exists to prevent. Resizing a nav tab on purpose
   * (`size="sm"`) still works.
   */
  size?: Exclude<ButtonVariants['size'], 'nav'>
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
})

defineSlots<{
  default: () => unknown
}>()

/**
 * `nav` is one role, not two knobs. Its geometry has to live in `size` — that
 * is the dimension the icon rule belongs to — but making a caller write
 * `variant="nav" size="nav"` invites the half-applied pairing where the tab is
 * shaped like a tab and still shrinks its icon. An explicit `size` still wins,
 * so a nav tab can be resized deliberately.
 */
const size = computed<ButtonVariants['size']>(
  () => props.size ?? (props.variant === 'nav' ? 'nav' : undefined),
)

/**
 * Resolved once per prop change rather than on every render. cva variant
 * lookup plus `clsx` plus tailwind-merge over a ~500-character class list is
 * not free, and a template expression pays it whenever anything above re-renders
 * — for every tab in the bar on each route change.
 */
const classes = computed(() =>
  cn(buttonVariants({ variant: props.variant, size: size.value }), props.class),
)
</script>

<template>
  <Primitive
    data-slot="button"
    :data-variant="props.variant"
    :data-size="size"
    :as="props.as"
    :as-child="props.asChild"
    :class="classes"
  >
    <slot />
  </Primitive>
</template>
