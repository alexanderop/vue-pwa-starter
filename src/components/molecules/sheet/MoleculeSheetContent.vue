<script setup lang="ts">
import type { DrawerContentEmits, DrawerContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
  injectDrawerRootContext,
  useForwardPropsEmits,
} from 'reka-ui'
import { useTemplateRef, watch } from 'vue'
import { useCoarsePointerAutoFocus } from '@/composables/useCoarsePointerAutoFocus'
import { useScrollRegionTabIndex } from '@/composables/useScrollRegionTabIndex'
import { cn } from '@/lib/utils'
import MoleculeSheetHandle from './MoleculeSheetHandle.vue'

/**
 * Portal, scrim, surface, handle, and a scrolling body — mounted here rather
 * than left to the call site, because every sheet in this app wants all five
 * and forgetting the scrim is a silent accessibility regression rather than a
 * visible mistake. Same reasoning as `MoleculeDialogContent`.
 *
 * Three geometry rules, none of them decorative:
 *
 * - `bottom: var(--keyboard-inset)` and a height capped at
 *   `100dvh - var(--keyboard-inset)`, so the on-screen keyboard pushes the
 *   sheet up instead of burying its submit button. `useKeyboardInset` in
 *   App.vue keeps that variable honest.
 * - Enter and exit animate the `translate` property while the live swipe
 *   drives `transform`. Reka writes `--drawer-swipe-movement-y` continuously,
 *   and animating the same property the finger owns replaces the gesture
 *   mid-drag.
 * - `data-[swiping]:transition-none` rather than a zero-length duration:
 *   while the finger is down there is no transition, which is a state and not
 *   a timing.
 */
defineOptions({ inheritAttrs: false })

const props = defineProps<
  DrawerContentProps & { class?: HTMLAttributes['class']; overlayClass?: HTMLAttributes['class'] }
>()
const emits = defineEmits<DrawerContentEmits>()

defineSlots<{
  default: () => unknown
  header?: () => unknown
  footer?: () => unknown
}>()

const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class', 'overlayClass'), emits)

const handleOpenAutoFocus = useCoarsePointerAutoFocus((event) => emits('openAutoFocus', event))

const rootContext = injectDrawerRootContext()

/**
 * Where the keyboard came from, so it has somewhere to go back to.
 *
 * Reka's `FocusScope` restores focus on unmount only while it is *trapped*,
 * and `DrawerContent` computes `trapFocus` from `rootContext.open` — so
 * closing flips the trap off before the scope unmounts and the restore never
 * runs. Focus lands on `<body>`, which means the next Tab starts from the top
 * of the document rather than from the control the user opened the sheet with.
 * `Dialog` does not have this shape, which is why the quick-add sheet only
 * grew the bug when it moved to `Drawer`.
 *
 * Captured on the rising edge of `open` with a pre-flush watcher, which is the
 * last moment before the content mounts and the scope moves focus. Not in
 * `setup`: this component is rendered for the whole life of its parent and
 * only its *contents* mount on open, so setup runs once, with `<body>` focused.
 */
let openedFrom: HTMLElement | null = null

watch(
  () => rootContext.open.value,
  (open) => {
    if (open) {
      const active = globalThis.document.activeElement
      openedFrom = active instanceof HTMLElement ? active : null
      return
    }
    // Restore on the falling edge as well as from `closeAutoFocus`. The exit
    // is animated, so the scope may unmount long after the sheet stopped being
    // the thing the user is looking at — and whether the scope emits at all
    // depends on it still being trapped, which is the shape that dropped focus
    // on `<body>` in the first place.
    restoreFocus()
  },
  // `immediate`, because a sheet can be mounted *already open*: App.vue keeps
  // the quick-add sheet behind a `v-if` until first use, so the component tree
  // appears with `open` already true and a lazy watcher never sees the rising
  // edge. Missing it means never capturing where focus came from.
  { immediate: true },
)

function restoreFocus(): void {
  if (openedFrom === null || !openedFrom.isConnected) return
  openedFrom.focus({ preventScroll: true })
}

function handleCloseAutoFocus(event: Event): void {
  emits('closeAutoFocus', event)
  if (event.defaultPrevented || openedFrom === null || !openedFrom.isConnected) return
  event.preventDefault()
  restoreFocus()
}

const bodyElement = useTemplateRef<HTMLElement>('body')

/** Focusable only when nothing inside it is — see the composable for why. */
const bodyTabIndex = useScrollRegionTabIndex(bodyElement)
</script>

<template>
  <DrawerPortal>
    <DrawerOverlay data-slot="sheet-overlay" :class="cn('overlay-scrim', props.overlayClass)" />
    <DrawerContent
      data-slot="sheet-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="
        cn(
          'bg-background fixed inset-x-0 bottom-[var(--keyboard-inset,0px)] z-(--z-sheet) mx-auto flex max-h-[calc(100dvh-var(--keyboard-inset,0px))] w-full max-w-lg flex-col gap-4 overflow-hidden rounded-t-2xl border shadow-sheet outline-none safe-area-bottom [--safe-bottom-min:1.5rem]',
          '[transform:translateY(var(--drawer-swipe-movement-y,0px))] transition-transform duration-(--duration-sheet-in) will-change-transform data-[swiping]:transition-none',
          'data-[state=open]:animate-drawer-up data-[state=closed]:animate-drawer-down',
          props.class,
        )
      "
      @close-auto-focus="handleCloseAutoFocus"
      @open-auto-focus="handleOpenAutoFocus"
    >
      <MoleculeSheetHandle />

      <slot name="header" />

      <!-- The scroll region. The sheet is capped at the keyboard-adjusted
           viewport height, so with a keyboard open on a landscape phone there
           may be ~150px left; everything but the handle and the footer
           scrolls, which is what keeps the submit button reachable. `min-h-0`
           is required — a flex item defaults to `min-height: auto` and would
           refuse to shrink. -->
      <div
        ref="body"
        data-slot="sheet-body"
        :tabindex="bodyTabIndex"
        class="scroll-region px-[calc(var(--spacing-gutter)+0.25rem)] focus-ring-inset"
      >
        <slot />
      </div>

      <slot name="footer" />
    </DrawerContent>
  </DrawerPortal>
</template>
