<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { DragAxis } from '@/lib/swipeRow'
import { computed, ref } from 'vue'
import { clampOffset, latchesOpen, resolveAxis } from '@/lib/swipeRow'
import { cn } from '@/lib/utils'

/**
 * A row whose trailing actions are revealed by dragging it left.
 *
 * The rule that shapes the whole component: **the actions are always in the
 * DOM and always focusable.** They are hidden by being slid off the edge, not
 * by `v-if` and not by `display: none`, so a keyboard or switch user Tabs
 * straight to "Delete" and the row opens itself to show what they landed on. A
 * destructive action reachable only by swiping is unreachable for anyone who
 * cannot swipe — convention 5 in docs/touch-conventions.md, and the reason
 * this is not a gesture with a fallback bolted on afterwards.
 *
 * The gesture itself is deliberately small: a horizontal drag past a threshold
 * latches open, anything less springs back, and a vertical drag is ignored so
 * the list keeps scrolling. There is no velocity model and no rubber-banding —
 * those belong to a drawer, and a list row that behaves like one feels broken.
 *
 * The arithmetic is in `@/lib/swipeRow`, where it is unit-tested at every
 * boundary; what is left here is the DOM.
 */
const props = defineProps<{
  class?: HTMLAttributes['class']
  /** How far the row slides when open. Match it to the actions' width. */
  actionWidth?: number
}>()

defineSlots<{
  /** The row content. */
  default: () => unknown
  /** The revealed actions. Always rendered, always reachable. */
  actions: () => unknown
}>()

const openWidth = computed(() => props.actionWidth ?? 96)

const isOpen = ref(false)
const dragOffset = ref(0)
const isDragging = ref(false)

let start: { x: number; y: number } | undefined
/** Undecided until the drag has travelled far enough to have a direction. */
let axis: DragAxis = 'undecided'

const offset = computed(() =>
  isDragging.value ? dragOffset.value : isOpen.value ? -openWidth.value : 0,
)

function reset(): void {
  isDragging.value = false
  start = undefined
  axis = 'undecided'
}

function beginDrag(event: PointerEvent): void {
  isDragging.value = true
  // Capture, so a finger that leaves the row mid-drag keeps driving it —
  // otherwise the row freezes wherever the pointer crossed its edge.
  if (event.currentTarget instanceof Element) event.currentTarget.setPointerCapture(event.pointerId)
}

function onPointerDown(event: PointerEvent): void {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  start = { x: event.clientX, y: event.clientY }
  axis = 'undecided'
}

/** Commits to an axis once. A vertical drag is handed back to the list. */
function decideAxis(dx: number, dy: number): DragAxis {
  if (axis === 'undecided') axis = resolveAxis(dx, dy)
  if (axis === 'vertical') reset()

  return axis
}

function trackDrag(event: PointerEvent, dx: number): void {
  if (!isDragging.value) beginDrag(event)

  dragOffset.value = clampOffset(isOpen.value ? -openWidth.value : 0, dx, openWidth.value)
}

function onPointerMove(event: PointerEvent): void {
  if (start === undefined) return

  const dx = event.clientX - start.x
  if (decideAxis(dx, event.clientY - start.y) === 'horizontal') trackDrag(event, dx)
}

function onPointerUp(): void {
  if (isDragging.value) isOpen.value = latchesOpen(dragOffset.value, openWidth.value)
  reset()
}

/** Tabbing into an action opens the row, so focus is never on something hidden. */
function onActionsFocusIn(): void {
  isOpen.value = true
}
</script>

<template>
  <li
    data-slot="swipeable-row"
    :data-state="isOpen ? 'open' : 'closed'"
    :class="cn('relative overflow-hidden', props.class)"
  >
    <!-- Underneath, at full row height, revealed rather than created. -->
    <div
      data-slot="swipeable-row-actions"
      class="absolute inset-y-0 right-0 flex items-stretch"
      :style="{ width: `${openWidth}px` }"
      @focusin="onActionsFocusIn"
    >
      <slot name="actions" />
    </div>

    <div
      data-slot="swipeable-row-content"
      class="relative bg-card select-none [touch-action:pan-y]"
      :class="
        isDragging
          ? 'transition-none'
          : 'transition-transform duration-(--duration-base) ease-standard'
      "
      :style="{ transform: `translateX(${offset}px)` }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <slot />
    </div>
  </li>
</template>
