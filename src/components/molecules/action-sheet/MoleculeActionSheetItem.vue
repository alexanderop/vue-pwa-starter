<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * One action. A full-width, 44px row rather than a menu item, because that is
 * what a thumb can hit without aiming.
 *
 * `destructive` is the one variant, and it is a variant rather than a class
 * the call site remembers: a delete row that looks like every other row is how
 * people delete things they meant to keep, and it is exactly the styling that
 * gets forgotten.
 */
// The `<li>` is structure the list needs; `@click`, `disabled` and every
// `aria-*` belong to the button that is actually the control.
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{ class?: HTMLAttributes['class']; destructive?: boolean }>(),
  { destructive: false },
)

defineSlots<{
  default: () => unknown
  icon?: () => unknown
}>()
</script>

<template>
  <li data-slot="action-sheet-item">
    <button
      type="button"
      :data-destructive="props.destructive ? '' : undefined"
      :class="
        cn(
          'flex min-h-touch-target w-full items-center gap-3 rounded-md px-gutter py-3 text-left text-label transition-colors duration-(--duration-fast) select-none touch-manipulation hover:bg-accent active:bg-accent focus-ring-inset disabled:pointer-events-none disabled:opacity-50',
          props.destructive && 'text-destructive hover:bg-destructive/10 active:bg-destructive/10',
          props.class,
        )
      "
      v-bind="$attrs"
    >
      <span v-if="$slots.icon" class="flex shrink-0"><slot name="icon" /></span>
      <slot />
    </button>
  </li>
</template>
