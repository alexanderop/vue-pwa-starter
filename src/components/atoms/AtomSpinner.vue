<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { LoaderCircle } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { cn } from '@/lib/utils'

/**
 * A busy indicator for work the user just asked for — a tapped Import, an
 * export being assembled. Its counterpart is `AtomSkeleton`, which is for
 * content that has not arrived yet; the difference is whether the user is
 * waiting for *their* action or for the page.
 *
 * `role="status"` with a name, rather than a bare decorative icon: a spinner
 * that only spins says nothing to a screen reader, and "nothing is happening"
 * is the one thing it must not say. The name comes from the catalogue like
 * every other user-facing string in this app, which is why a primitive
 * reaches for `useI18n()` here (docs/ui-components.md).
 *
 * `aria-live` is deliberately absent. `role="status"` already implies
 * `aria-live="polite"`, and the announcement that matters is the element
 * *appearing*, which a live region in the consumer's tree — not in the
 * spinner itself — is what actually reports.
 */
const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { t } = useI18n()
</script>

<template>
  <LoaderCircle
    data-slot="spinner"
    role="status"
    :aria-label="t('common.aria.loading')"
    :class="cn('size-4 shrink-0 animate-spin', props.class)"
  />
</template>
