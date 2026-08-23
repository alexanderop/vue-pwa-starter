<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterView } from 'vue-router'
import AtomButton from '@/components/atoms/AtomButton.vue'
import OrganismAppShell from '@/components/organisms/OrganismAppShell.vue'
import OrganismOfflineBanner from '@/components/organisms/OrganismOfflineBanner.vue'
import OrganismPwaInstallPrompt from '@/components/organisms/OrganismPwaInstallPrompt.vue'
import MoleculePwaUpdatePrompt from '@/components/molecules/MoleculePwaUpdatePrompt.vue'
import MoleculeToastViewport from '@/components/molecules/MoleculeToastViewport.vue'
import { useKeyboardInset } from '@/composables/useKeyboardInset'
import { useLocale } from '@/composables/useLocale'
import { useTheme } from '@/composables/useTheme'
import { NAV_ITEMS } from '@/router/navigation'
import { useQuickAddStore } from '@/stores/quickAdd'
import type { NavItem } from '@/types/navigation'

// Loaded on first use so the quick-add machinery stays off the startup path.
const QuickAddNoteSheet = defineAsyncComponent(
  () => import('@/features/notes/components/QuickAddNoteSheet.vue'),
)

const { t } = useI18n()

useTheme()
useLocale()
useKeyboardInset()

const quickAdd = useQuickAddStore()

const navItems = computed<Array<NavItem>>(() =>
  NAV_ITEMS.map((item) => ({
    routeName: item.routeName,
    icon: item.icon,
    label: t(item.labelKey),
  })),
)
</script>

<template>
  <div data-testid="app" class="h-full">
    <OrganismAppShell :items="navItems">
      <RouterView />

      <template #center-action>
        <!-- The outer button, not the inner span, is the hit target — so the
             `nav` variant goes here and the circle is a plain span. One press
             transform, on the thing that was actually pressed: the span used
             to carry its own `active:scale-95` on top of the tab's, and two
             nested presses compound into a jump.

             The variant is also what keeps the 26px Plus at 26px. Lucide sets
             its size as an attribute, and the button base's svg rule used to
             overrule it — which is what the suppression comment here used to
             be about. -->
        <AtomButton
          variant="nav"
          class="py-2"
          :aria-label="t('quickAdd.open')"
          @click="quickAdd.open()"
        >
          <span
            class="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-floating"
          >
            <Plus :size="26" aria-hidden="true" />
          </span>
        </AtomButton>
      </template>
    </OrganismAppShell>

    <QuickAddNoteSheet v-if="quickAdd.hasOpened" v-model:open="quickAdd.isOpen" />
    <OrganismOfflineBanner />
    <MoleculePwaUpdatePrompt />
    <OrganismPwaInstallPrompt />
    <MoleculeToastViewport />
  </div>
</template>
