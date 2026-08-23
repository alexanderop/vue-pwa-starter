<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import {
  MoleculeSheet,
  MoleculeSheetContent,
  MoleculeSheetDescription,
  MoleculeSheetHeader,
  MoleculeSheetTitle,
} from '@/components/molecules/sheet'
import { cn } from '@/lib/utils'

/**
 * The native overflow affordance: a short list of actions that slides up from
 * the bottom edge.
 *
 * Not a menu. A dropdown anchored to a 24px "⋯" button is a desktop idiom that
 * puts a 40px-wide list of 32px rows under a thumb; the same choice presented
 * as full-width rows at the bottom of the screen is reachable one-handed,
 * which is the entire reason this shape exists on phones.
 *
 * Built on `MoleculeSheet`, so it inherits the swipe dismissal, the scrim, the
 * focus restore and the keyboard-aware geometry rather than reimplementing
 * any of it. What it adds is the row list and the cancel row.
 */
const props = defineProps<{
  class?: HTMLAttributes['class']
  /**
   * What the sheet is about — and the dialog's accessible name.
   *
   * A prop rather than a slot, because Reka refuses to name the dialog from
   * anything but a `DrawerTitle`: give it a plain `<p>` and `aria-labelledby`
   * points at nothing, axe reports an unnamed dialog, and Reka logs a warning
   * nobody reads. Making the title impossible to omit is cheaper than a rule
   * saying not to omit it.
   */
  title: string
}>()

const open = defineModel<boolean>('open', { default: false })

defineSlots<{
  /** The actions, as `MoleculeActionSheetItem`s. */
  default: () => unknown
  /** One line under the title saying what these actions apply to. */
  description?: () => unknown
  /** The dismissive row, separated from the actions. */
  cancel?: () => unknown
}>()
</script>

<template>
  <MoleculeSheet v-model:open="open">
    <MoleculeSheetContent data-slot="action-sheet" :class="cn('gap-2', props.class)">
      <template #header>
        <MoleculeSheetHeader>
          <MoleculeSheetTitle>{{ props.title }}</MoleculeSheetTitle>
          <MoleculeSheetDescription v-if="$slots.description">
            <slot name="description" />
          </MoleculeSheetDescription>
        </MoleculeSheetHeader>
      </template>

      <!-- `list` and not a `menu`: these are buttons that do something now,
           not a menu of navigable commands, and `role="menu"` would promise a
           keyboard model (arrow keys, type-ahead, Escape-to-parent) that is
           not implemented here. -->
      <ul data-slot="action-sheet-items" class="flex list-none flex-col gap-1 p-0">
        <slot />
      </ul>

      <!-- Its own list, not a loose `<li>`: the cancel row is a
           `MoleculeActionSheetItem` like any other and an `<li>` outside a
           list is invalid markup that axe reports. Separate lists are also
           the honest structure — "the actions" and "the way out" are two
           groups, which is why there is a rule between them. -->
      <template v-if="$slots.cancel" #footer>
        <ul data-slot="action-sheet-cancel" class="mt-1 list-none border-t p-0 pt-2">
          <slot name="cancel" />
        </ul>
      </template>
    </MoleculeSheetContent>
  </MoleculeSheet>
</template>
