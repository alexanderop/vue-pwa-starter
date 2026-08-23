<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * The screen with nothing on it — which in a local-first app is the first
 * screen every user sees, not an edge case.
 *
 * Four slots and no `variant` prop, because the four states this covers differ
 * in their *words*, not in their shape: nothing yet, nothing matched, nothing
 * loaded because something broke. A `variant="error"` would only pick a colour,
 * and the call site has to write the sentence either way.
 *
 * The action slot is where the way out goes, and it is not optional in spirit:
 * an empty state that only says "no results" is a dead end. Filtered-to-empty
 * gets "clear the filter"; an error gets "try again"; first-run gets the thing
 * that creates the first item.
 */
const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /**
     * The element the headline renders as.
     *
     * A `p` by default, because a component cannot know what heading level is
     * free where it was dropped, and an `h2` under no `h1` is worse than a
     * paragraph. A screen that *does* know — `NotesView`, which owns the `h1`
     * above it — passes the level, and then a screen-reader user browsing by
     * heading lands on the empty state instead of walking past it.
     */
    titleAs?: 'p' | 'h2' | 'h3' | 'h4'
  }>(),
  { titleAs: 'p' },
)

defineSlots<{
  /** The headline. A sentence fragment, not a status code. */
  default: () => unknown
  /** An illustrative icon, hidden from assistive technology by the caller. */
  icon?: () => unknown
  /** One sentence saying what to do about it. */
  description?: () => unknown
  /** The way out. */
  action?: () => unknown
}>()
</script>

<template>
  <div
    data-slot="empty-state"
    :class="
      cn('flex flex-col items-center justify-center gap-3 px-gutter py-12 text-center', props.class)
    "
  >
    <span
      v-if="$slots.icon"
      data-slot="empty-state-icon"
      class="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
    >
      <slot name="icon" />
    </span>

    <!-- `<component :is>`, not reka's `Primitive`: reka is the private
         substrate of the primitive layer, and this is a flat molecule. A
         literal tag name needs nothing more than the dynamic component. -->
    <component
      :is="props.titleAs"
      data-slot="empty-state-title"
      class="text-section-title font-semibold text-foreground"
    >
      <slot />
    </component>

    <p
      v-if="$slots.description"
      data-slot="empty-state-description"
      class="max-w-xs text-callout text-muted-foreground"
    >
      <slot name="description" />
    </p>

    <div v-if="$slots.action" data-slot="empty-state-action" class="mt-1">
      <slot name="action" />
    </div>
  </div>
</template>
