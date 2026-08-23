<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import OrganismBottomNav from '@/components/organisms/OrganismBottomNav.vue'
import type { NavItem } from '@/types/navigation'

/**
 * Mobile app shell: fixed-height flex column with a scrollable main area and
 * a bottom tab bar. Navigation is config-driven — pass the tabs as `items`
 * (see src/router/navigation.ts). An optional #center-action slot renders a
 * floating action button between the two halves of the tab bar, and is
 * forwarded straight through to `OrganismBottomNav`.
 *
 * The shell owns the column, the insets, and the decision to show navigation
 * at all; `OrganismBottomNav` owns what a tab is. Full-screen routes opt out
 * with `meta: { hideNav: true }`.
 */
defineProps<{
  items: ReadonlyArray<NavItem>
}>()

defineSlots<{
  default: () => unknown
  'center-action'?: () => unknown
}>()

const route = useRoute()

const hideNavigation = computed(() => route.meta.hideNav === true)
</script>

<template>
  <!-- The top and side insets go on the shell root, not on <main>. A sticky
       element's constraint rectangle is the scrollport — the scroll
       container's padding box — so padding-top on <main> would not push
       PageHeader's `sticky top-0` down; the header would stick flush to the
       top of <main> and slide under the status bar, which is the bug this
       pays off. One declaration here is correct with or without a sticky
       header, and cannot be double-paid. `bg-background` paints under the
       padding, so the status-bar strip is filled rather than transparent. -->
  <div class="flex h-dvh flex-col bg-background safe-area-top safe-area-x">
    <main
      class="flex-1 overflow-y-auto overscroll-contain"
      :class="hideNavigation && 'safe-area-bottom'"
    >
      <slot />
    </main>

    <!-- Where the nav does not render (meta.hideNav), <main> pays the bottom
         inset instead — see the `:class` above. -->
    <OrganismBottomNav v-if="!hideNavigation" :items="items">
      <template v-if="$slots['center-action']" #center-action
        ><slot name="center-action"
      /></template>
    </OrganismBottomNav>
  </div>
</template>
