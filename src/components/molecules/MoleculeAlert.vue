<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * A message about the state of things, in place rather than over the top.
 *
 * The tone is a `variant` rather than four components because these differ in
 * colour and in nothing else — the structure, the slots and the semantics are
 * identical. What is *not* cosmetic is the role: `destructive` announces
 * itself, the rest do not.
 *
 * `role="alert"` interrupts a screen reader mid-sentence, which is correct for
 * "your last write failed" and rude for "everything saved". So the role
 * follows the tone, and a call site cannot pick one without the other.
 */
// A plain lookup, not `cva`: cva is the private substrate of the primitive
// layer (atoms and compound directories), and a flat molecule is app code —
// eslint.config.ts enforces that boundary. One dimension with four values
// needs nothing cva provides anyway.
const TONES = {
  info: 'border-border bg-card text-card-foreground [&>[data-slot=alert-icon]]:text-muted-foreground',
  success:
    'border-success/30 bg-success/10 text-foreground [&>[data-slot=alert-icon]]:text-success',
  warning:
    'border-warning/40 bg-warning/10 text-foreground [&>[data-slot=alert-icon]]:text-warning',
  destructive:
    'border-destructive/30 bg-destructive/10 text-foreground [&>[data-slot=alert-icon]]:text-destructive',
} as const

const BASE = 'relative flex w-full items-start gap-3 rounded-lg border px-gutter py-3 text-callout'

const props = withDefaults(
  defineProps<{ class?: HTMLAttributes['class']; tone?: keyof typeof TONES }>(),
  { tone: 'info' },
)

defineSlots<{
  default: () => unknown
  icon?: () => unknown
  /** A dismiss control, or the one action that resolves the alert. */
  action?: () => unknown
}>()
</script>

<template>
  <div
    data-slot="alert"
    :data-tone="props.tone"
    :role="props.tone === 'destructive' ? 'alert' : 'status'"
    :class="cn(BASE, TONES[props.tone], props.class)"
  >
    <span v-if="$slots.icon" data-slot="alert-icon" class="mt-0.5 flex shrink-0">
      <slot name="icon" />
    </span>

    <div data-slot="alert-body" class="min-w-0 flex-1"><slot /></div>

    <div v-if="$slots.action" data-slot="alert-action" class="-my-1 flex shrink-0 items-center">
      <slot name="action" />
    </div>
  </div>
</template>
