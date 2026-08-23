<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'

/**
 * One row. Four slots rather than four props: `leading` for an icon, the
 * default slot for the title, `description` for a second line, and `trailing`
 * for a chevron, a value, or a control.
 *
 * `as` decides what the row *is*. The default `div` is a row that presents
 * something; `as="button"` or `as-child` with a `RouterLink` makes it a row
 * that goes somewhere, and only then does it take a press and a hover. That
 * branch is written as `[&:is(a,button)]:` rather than as an `interactive`
 * prop: a static row that highlights under a thumb is a row promising
 * something it will not do, and a flag is a thing a call site forgets to pass
 * while `as` is a thing it cannot.
 *
 * The title truncates and the row does not: `min-w-0` on the text column is
 * what lets it, and without it a long note title pushes the trailing chevron
 * off the screen instead of ellipsing. See Guidelines/Small screens.
 */
/**
 * Attributes land on the row's *content*, not on the `<li>`. The `<li>` is
 * structure the list needs and nothing a call site addresses; `disabled`,
 * `type="button"`, `aria-*` and a click handler all belong to the element that
 * actually is the control, and Vue's default fallthrough would have put them
 * on the wrapper where they do nothing.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<PrimitiveProps & { class?: HTMLAttributes['class'] }>(), {
  as: 'div',
})

defineSlots<{
  default: () => unknown
  leading?: () => unknown
  description?: () => unknown
  trailing?: () => unknown
}>()
</script>

<template>
  <li data-slot="list-row">
    <Primitive
      data-slot="list-row-content"
      v-bind="$attrs"
      :as="props.as"
      :as-child="props.asChild"
      :class="
        cn(
          'flex min-h-touch-target w-full items-center gap-3 px-gutter py-3 text-left',
          'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
          '[&:is(a,button)]:touch-manipulation [&:is(a,button)]:transition-colors [&:is(a,button)]:duration-(--duration-fast) [&:is(a,button)]:select-none [&:is(a,button)]:hover:bg-accent [&:is(a,button)]:active:bg-accent [&:is(a,button)]:focus-ring-inset',
          props.class,
        )
      "
    >
      <span v-if="$slots.leading" data-slot="list-row-leading" class="flex shrink-0 items-center">
        <slot name="leading" />
      </span>

      <span data-slot="list-row-text" class="flex min-w-0 flex-1 flex-col">
        <span class="truncate text-label"><slot /></span>
        <span v-if="$slots.description" class="truncate text-footnote text-muted-foreground">
          <slot name="description" />
        </span>
      </span>

      <span
        v-if="$slots.trailing"
        data-slot="list-row-trailing"
        class="flex shrink-0 items-center gap-2 text-muted-foreground"
      >
        <slot name="trailing" />
      </span>
    </Primitive>
  </li>
</template>
