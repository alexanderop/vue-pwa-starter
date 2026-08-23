<script setup lang="ts">
import type { DrawerRootEmits, DrawerRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DrawerRoot, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

/**
 * A bottom sheet on Reka's `Drawer`: a finger can drag it down and let go, and
 * velocity decides whether it closes.
 *
 * That is the whole reason this exists beside `MoleculeDialog`, whose own
 * comment says it: the dialog draws a drag handle that is a *visual grip*
 * rather than a gesture, because `Dialog` has no swipe. A handle that does not
 * drag is an affordance that was never wired — convention 5 in
 * docs/touch-conventions.md — so anything showing one belongs here.
 *
 * Reach for `MoleculeDialog` when the surface is a dialog on a wide screen and
 * a sheet only because the screen is narrow. Reach for this when it is a sheet
 * on every screen. Guidelines/Sheet or dialog has the long answer.
 */
const props = withDefaults(
  defineProps<
    Omit<DrawerRootProps, 'open' | 'defaultOpen'> & { class?: HTMLAttributes['class'] }
  >(),
  {
    modal: true,
    swipeDirection: 'down',
  },
)
const emits = defineEmits<Pick<DrawerRootEmits, 'update:openComplete' | 'update:snapPoint'>>()

const open = defineModel<boolean>('open', { default: false })

defineSlots<{
  default: () => unknown
}>()

const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class'), emits)
</script>

<template>
  <!-- `DrawerRoot` is a provider and renders no element of its own, so the
       slot identity goes on a `display: contents` wrapper. Putting it on the
       root instead is an extraneous attribute Vue warns about and nothing
       ever receives. Same shape as `MoleculeNumericInput`. -->
  <DrawerRoot v-bind="forwarded" v-model:open="open">
    <div data-slot="sheet" :class="cn('contents', props.class)"><slot /></div>
  </DrawerRoot>
</template>
