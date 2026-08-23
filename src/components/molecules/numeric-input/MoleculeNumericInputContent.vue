<script setup lang="ts">
import type { DrawerContentEmits, DrawerContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DrawerContent, DrawerOverlay, DrawerPortal, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'
import { useNumericInputContext } from './numericInputContext'

const props = defineProps<
  DrawerContentProps & {
    class?: HTMLAttributes['class']
    overlayClass?: HTMLAttributes['class']
  }
>()
const emits = defineEmits<DrawerContentEmits>()

defineSlots<{
  default: () => unknown
}>()

const delegatedProps = reactiveOmit(props, 'class', 'overlayClass')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
const input = useNumericInputContext()
</script>

<template>
  <DrawerPortal>
    <DrawerOverlay
      data-slot="numeric-input-overlay"
      :class="cn('overlay-scrim', props.overlayClass)"
    />
    <!-- `data-[swiping]:transition-none` rather than a zero-length duration.
         What is wanted while the finger is down is the *absence* of a
         transition; spelling it as a timing would need a sixth motion token
         meaning "no motion", which is a state, not a duration. -->
    <DrawerContent
      data-slot="numeric-input-content"
      v-bind="forwarded"
      :class="
        cn(
          'bg-background fixed inset-x-0 bottom-0 z-(--z-sheet) mx-auto flex h-[min(100dvh,48rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border shadow-sheet outline-none safe-area-bottom [--safe-bottom-min:1rem]',
          '[transform:translateY(var(--drawer-swipe-movement-y,0px))] transition-transform duration-(--duration-sheet-in) will-change-transform data-[swiping]:transition-none',
          'data-[state=open]:animate-drawer-up data-[state=closed]:animate-drawer-down',
          props.class,
        )
      "
      @keydown="input.handleKeydown"
    >
      <slot />
    </DrawerContent>
  </DrawerPortal>
</template>
