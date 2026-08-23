<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ChevronDown } from '@lucide/vue'
import { cn } from '@/lib/utils'

/**
 * The native `<select>`, styled — not reka's `Select`.
 *
 * That is the deliberate half of this file. Reka has a `Select`, and it is
 * the right primitive on a desktop: a portalled listbox with its own focus
 * management and typeahead. On a phone it replaces the OS picker — the iOS
 * wheel, the Android bottom list, both of which the user already knows and
 * neither of which a portalled div reproduces — and it puts a second
 * overlay into a screen whose sheets are already negotiating with
 * `--keyboard-inset`. Mobile-first is this app's product, so the native
 * control wins and the wrapper is only paint.
 *
 * It is also why the model is `defineModel` rather than forwarding: there is
 * no reka part owning the value here, so this component owns it. See
 * docs/ui-components.md on which side owns state.
 *
 * `inheritAttrs: false` so `id`, `disabled`, `aria-*` land on the control the
 * consumer thinks they are addressing rather than on the positioning wrapper
 * — a `for="locale-select"` label pointing at a `<div>` labels nothing.
 */
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const model = defineModel<string>({ default: '' })

defineSlots<{
  /** The `<option>` / `<optgroup>` elements. */
  default: () => unknown
}>()
</script>

<template>
  <div data-slot="select-wrapper" class="relative w-full has-[select:disabled]:opacity-50">
    <select
      v-bind="$attrs"
      v-model="model"
      data-slot="select"
      :class="
        cn(
          'flex h-touch-target w-full appearance-none rounded-md border border-input bg-transparent px-3 py-2 pr-10 text-base shadow-raised transition-colors touch-manipulation focus-ring disabled:cursor-not-allowed pointer-fine:h-10 pointer-fine:text-sm',
          props.class,
        )
      "
    >
      <slot />
    </select>
    <!-- `pointer-events-none` is load-bearing rather than tidy: the chevron
         sits over the right edge of the control, which is exactly where a
         thumb reaches for it, and without this the tap lands on an SVG and
         the picker never opens. Covered in AtomSelect.stories.ts. -->
    <ChevronDown
      data-slot="select-icon"
      aria-hidden="true"
      class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
    />
  </div>
</template>
