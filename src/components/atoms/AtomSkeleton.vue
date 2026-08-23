<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * A placeholder shaped like the content that is coming.
 *
 * It carries no size of its own on purpose: the consumer sizes it to the
 * thing it stands in for (`class="h-5 w-2/3"`), because a skeleton whose
 * dimensions do not match what replaces it produces exactly the layout shift
 * it exists to prevent. That is the STYLE lever doing real work rather than
 * offering a theme.
 *
 * Hidden from assistive technology, which is a deviation from upstream: a
 * screen reader user gets nothing from a grey box, and a list of eight of
 * them is eight pieces of nothing. What they need is the *state*, announced
 * once by the region that owns the loading (`aria-busy` on the list), not by
 * each placeholder inside it.
 */
const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    data-slot="skeleton"
    aria-hidden="true"
    :class="cn('animate-pulse rounded-md bg-muted', props.class)"
  />
</template>
