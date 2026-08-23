<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { X } from '@lucide/vue'
import { reactiveOmit } from '@vueuse/core'
import { DialogClose, DialogContent, DialogPortal, useForwardPropsEmits } from 'reka-ui'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCoarsePointerAutoFocus } from '@/composables/useCoarsePointerAutoFocus'
import { useScrollRegionTabIndex } from '@/composables/useScrollRegionTabIndex'
import { cn } from '@/lib/utils'
import MoleculeDialogOverlay from './MoleculeDialogOverlay.vue'

/**
 * Keyboard-aware dialog content: a bottom sheet on small viewports, a
 * centered dialog from `sm:` up. Mobile-first is the product here, so this
 * is *the* dialog content — there is no separate desktop variant to pick
 * between. Pairs with useKeyboardInset() (App.vue), which keeps
 * `--keyboard-inset` up to date so the sheet sits above the on-screen
 * keyboard instead of underneath it.
 *
 * Portal and overlay are mounted here rather than left to the consumer:
 * every dialog in this app wants both, and forgetting the overlay is a
 * silent accessibility regression rather than a visible mistake.
 */
defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<
    DialogContentProps & {
      class?: HTMLAttributes['class']
      showCloseButton?: boolean
    }
  >(),
  { showCloseButton: true },
)
const emits = defineEmits<DialogContentEmits>()

const { t } = useI18n()

defineSlots<{
  default: () => unknown
}>()

const delegatedProps = reactiveOmit(props, 'class', 'showCloseButton')
const forwarded = useForwardPropsEmits(delegatedProps, emits)

const handleOpenAutoFocus = useCoarsePointerAutoFocus((event) => emits('openAutoFocus', event))

const bodyElement = useTemplateRef<HTMLElement>('body')

/** Focusable only when nothing inside it is — see the composable for why. */
const bodyTabIndex = useScrollRegionTabIndex(bodyElement)
</script>

<template>
  <DialogPortal>
    <MoleculeDialogOverlay />
    <!-- No `pb-6` beside `safe-area-bottom`: two utilities declaring
         padding-bottom at equal specificity hand the decision to generated
         stylesheet order, and the one that was winning resolves to 0px on any
         phone without a home indicator. The floor goes into the utility's
         `--safe-bottom-min` instead, so a single declaration wins by
         construction. -->
    <!-- Two elevations, because this is two components. Below `sm` it is a
         bottom sheet and casts `shadow-sheet` *upward* onto the content it
         occludes; at `sm` it becomes a centred dialog floating over the whole
         page, which is what `shadow-overlay` is for. -->
    <DialogContent
      data-slot="dialog-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="
        cn(
          'bg-background fixed bottom-[var(--keyboard-inset,0px)] left-0 right-0 z-(--z-sheet) flex w-full flex-col gap-4 overflow-hidden rounded-t-2xl border pt-2 px-4 shadow-sheet sm:shadow-overlay safe-area-bottom [--safe-bottom-min:1.5rem]',
          'max-h-[calc(100dvh-var(--keyboard-inset,0px))]',
          'data-[state=open]:animate-slide-up-mobile data-[state=closed]:animate-slide-down-mobile',
          'sm:data-[state=open]:animate-in sm:data-[state=closed]:animate-out sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95 sm:duration-(--duration-base)',
          'sm:bottom-auto sm:left-[50%] sm:right-auto sm:top-[50%] sm:max-w-lg sm:max-h-[calc(100vh-4rem)] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:p-6',
          props.class,
        )
      "
      @open-auto-focus="handleOpenAutoFocus"
    >
      <!-- No drag handle. There used to be one here — a grip bar that could
           not be dragged, with a comment saying reka's Drawer would wire it
           for real "and migrating to it is an API change rather than a CSS
           one". That migration has landed as `molecules/sheet/`, so a surface
           that wants a handle uses `MoleculeSheet` and gets a real one. Drawing
           an affordance nobody wired is convention 5 in
           docs/touch-conventions.md, and this was the last one. -->

      <!-- Scroll region, capped at the keyboard-adjusted viewport height: on a
           landscape phone with the keyboard open there may be only ~150px
           left, and everything except the footer scrolls, which is what keeps
           the submit button reachable. `scroll-region` carries the `min-h-0`
           that makes it shrink at all. -->
      <div ref="body" data-slot="dialog-body" :tabindex="bodyTabIndex" class="scroll-region">
        <slot />
      </div>

      <!-- Close button (desktop only) — below `sm` the sheet is dismissed by
           tapping the overlay, and a corner target that small is not a thumb
           target anyway. -->
      <DialogClose
        v-if="showCloseButton"
        data-slot="dialog-close"
        class="ring-offset-background focus:ring-ring absolute top-4 right-4 hidden rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none sm:block [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      >
        <X />
        <span class="sr-only">{{ t('common.buttons.close') }}</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
