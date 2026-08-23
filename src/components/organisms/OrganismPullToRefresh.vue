<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { LoaderCircle } from '@lucide/vue'
import { computed, ref, useTemplateRef } from 'vue'
import { useScrollRegionTabIndex } from '@/composables/useScrollRegionTabIndex'
import {
  canStartPull,
  pullDistance,
  pullPhase,
  pullProgress,
  PULL_THRESHOLD,
} from '@/lib/pullToRefresh'
import { cn } from '@/lib/utils'

/**
 * Pull down from the top of a list to refresh it.
 *
 * The rule that shapes it: **pull-to-refresh is never the only path to fresh
 * data.** It is undiscoverable, unreachable without a touch screen, and
 * impossible to describe to a screen reader — so this is an accelerator over a
 * refresh the app already offers some other way, and the story asserts that
 * other way exists. docs/touch-conventions.md, convention 5.
 *
 * Two things it does that a naive version does not:
 *
 * - It only starts at `scrollTop <= 0`. A pull that begins mid-list is
 *   somebody scrolling up, and claiming it fires a refresh every time a user
 *   reaches the top of a long list.
 * - It announces `ready` *before* the release. An indicator that only changes
 *   once you let go has missed the moment it exists for.
 *
 * The state is announced through a polite live region rather than left to the
 * spinner. "Release to refresh" is information, and a rotating icon is not a
 * sentence.
 */
const props = defineProps<{
  class?: HTMLAttributes['class']
  /** Runs on release past the threshold. The indicator holds until it settles. */
  onRefresh: () => Promise<void>
  /** Announced while pulling, ready, and refreshing. Three sentences, translated by the caller. */
  labels: { pull: string; release: string; refreshing: string }
}>()

defineSlots<{
  default: () => unknown
}>()

const travel = ref(0)
const isRefreshing = ref(false)
const scroller = useTemplateRef<HTMLElement>('scroller')

/** Focusable only when nothing inside it is — see the composable for why. */
const scrollerTabIndex = useScrollRegionTabIndex(scroller)

let start: number | undefined

const distance = computed(() => pullDistance(travel.value))
/**
 * Whether a gesture is in flight, as reactive state.
 *
 * `start` is a plain `let` — it is the anchor coordinate, not a rendering
 * input — so the template must not read it: a binding Vue does not track is a
 * class that only appears to update because something else changed in the same
 * handler.
 */
const isPulling = computed(() => travel.value > 0)
const phase = computed(() => pullPhase(distance.value, isRefreshing.value))
const progress = computed(() => pullProgress(distance.value))

const message = computed(() => {
  if (phase.value === 'refreshing') return props.labels.refreshing
  if (phase.value === 'ready') return props.labels.release

  return phase.value === 'pulling' ? props.labels.pull : ''
})

/** Only from rest, and only from the very top of the list. */
function mayStart(): boolean {
  return !isRefreshing.value && canStartPull(scroller.value?.scrollTop ?? 0)
}

function onPointerDown(event: PointerEvent): void {
  if (!mayStart()) return
  start = event.clientY
  // Captured, so the release always lands here. Without it the content slides
  // down under the finger and `pointerup` can fire on whatever is now beneath
  // it — the gesture then never ends and the refresh never runs.
  if (event.currentTarget instanceof Element) event.currentTarget.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent): void {
  if (start === undefined) return
  travel.value = Math.max(0, event.clientY - start)
}

async function refresh(): Promise<void> {
  isRefreshing.value = true
  try {
    await props.onRefresh()
  } finally {
    isRefreshing.value = false
  }
}

async function onPointerUp(): Promise<void> {
  const shouldRefresh = start !== undefined && phase.value === 'ready'
  start = undefined
  travel.value = 0

  if (shouldRefresh) await refresh()
}
</script>

<template>
  <div data-slot="pull-to-refresh" :class="cn('relative overflow-hidden', props.class)">
    <!-- The indicator lives above the content and is revealed by it moving
         down, so nothing is ever drawn over the list. -->
    <div
      data-slot="pull-to-refresh-indicator"
      :data-phase="phase"
      class="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center"
      :style="{ height: `${PULL_THRESHOLD}px`, opacity: phase === 'idle' ? 0 : 1 }"
    >
      <LoaderCircle
        class="size-5 text-muted-foreground"
        :class="phase === 'refreshing' && 'animate-spin'"
        :style="{ rotate: `${progress * 360}deg` }"
        aria-hidden="true"
      />
    </div>

    <!-- Polite, because a refresh nobody asked to be interrupted for is not an
         alert. Empty at rest, so it announces nothing while idle. -->
    <p class="sr-only" role="status" aria-live="polite">{{ message }}</p>

    <div
      ref="scroller"
      data-slot="pull-to-refresh-content"
      :tabindex="scrollerTabIndex"
      class="h-full overflow-y-auto overscroll-contain [touch-action:pan-y] focus-ring-inset"
      :class="isPulling ? '' : 'transition-transform duration-(--duration-base) ease-standard'"
      :style="{
        transform: `translateY(${isRefreshing ? PULL_THRESHOLD : distance}px)`,
      }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <slot />
    </div>
  </div>
</template>
