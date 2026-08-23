<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AtomButton from '@/components/atoms/AtomButton.vue'
import type { NavItem } from '@/types/navigation'

/**
 * The bottom tab bar, extracted from `OrganismAppShell` so the shell composes
 * navigation rather than containing it.
 *
 * Every tab is `AtomButton` with the `nav` variant. That variant exists
 * because this markup used to be hand-rolled behind two `eslint-disable
 * vue/no-restricted-html-elements` comments, both of which said the same
 * thing: the button atom could not express a tab, and the fix was a variant on
 * the atom rather than an override here. Both comments are gone.
 *
 * `aria-current="page"` is the only selected-state input. The `nav` variant
 * styles that attribute directly, so the highlight and the announcement cannot
 * come apart.
 */
const { items } = defineProps<{
  items: ReadonlyArray<NavItem>
}>()

defineSlots<{
  'center-action'?: () => unknown
}>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const slots = useSlots()

/**
 * The tabs, in the columns they are laid out in.
 *
 * With a center action they split around it; without one they are a single
 * column and nothing is rendered after them. One computed rather than a
 * `splitIndex`/`left`/`right` trio so the template can loop over columns —
 * the two halves used to be identical blocks of markup written twice, which
 * is two places to update a tab and one chance to update only one of them.
 */
const columns = computed<ReadonlyArray<ReadonlyArray<NavItem>>>(() => {
  if (slots['center-action'] === undefined) return [items]

  const half = Math.ceil(items.length / 2)
  return [items.slice(0, half), items.slice(half)]
})

function isActive(routeName: string): boolean {
  return route.name === routeName
}

function navigate(routeName: string): void {
  void router.push({ name: routeName })
}
</script>

<template>
  <!-- No `sticky bottom-0`: the nav is a non-flexing sibling in a
       non-scrolling h-dvh column, so there is no scrollport for it to stick
       against. The class read as load-bearing and was inert. -->
  <!-- `shadow-sticky` is the elevation level named for exactly this: a bar
       with content scrolled under it. The border alone reads as a seam
       between two panes; the shadow is what says the content passes beneath.
       The nav is a flex item, so its z-index applies without `position`. -->
  <nav
    :aria-label="t('nav.ariaLabel')"
    class="z-(--z-nav) border-t bg-card shadow-sticky safe-area-bottom"
  >
    <div class="flex min-h-nav-height justify-around">
      <template v-for="(column, index) in columns" :key="index">
        <AtomButton
          v-for="item in column"
          :key="item.routeName"
          variant="nav"
          :aria-current="isActive(item.routeName) ? 'page' : undefined"
          @click="navigate(item.routeName)"
        >
          <component :is="item.icon" :size="24" class="mb-1" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </AtomButton>

        <!-- Between the columns, which only exist when there is a slot to put
             between them. -->
        <slot v-if="index === 0" name="center-action" />
      </template>
    </div>
  </nav>
</template>
