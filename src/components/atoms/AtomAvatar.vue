<script setup lang="ts">
import type { AvatarFallbackProps, AvatarImageProps, AvatarRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { AvatarFallback, AvatarImage, AvatarRoot } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

/**
 * An avatar, with the loading state that decides what a broken image looks
 * like.
 *
 * Reka's `AvatarImage` does not render until the image has actually loaded, so
 * the fallback is what shows while it is in flight and what stays if it never
 * arrives. That is the whole reason this is not an `<img>` with an `onerror`:
 * the failure path is the common path on a flaky mobile connection, and it has
 * to be the *designed* state rather than a broken-image glyph.
 *
 * `delay-ms` stops the fallback flashing for an image that resolves from cache
 * in 20ms. It is normalised here because Reka reads it twice with different
 * meanings: `undefined` renders the fallback immediately, but `0` starts it
 * hidden and then never starts the timer that would reveal it — so a caller
 * asking for "no delay" the obvious way gets an avatar that is permanently
 * blank. Zero and undefined mean the same thing to this component.
 */
const props = withDefaults(
  defineProps<
    AvatarRootProps & {
      class?: HTMLAttributes['class']
      src?: AvatarImageProps['src']
      alt?: string
      delayMs?: AvatarFallbackProps['delayMs']
    }
  >(),
  { delayMs: 200 },
)

defineSlots<{
  /** The fallback — initials, or an icon. Shown while loading and on failure. */
  default: () => unknown
}>()

const fallbackDelay = computed(() => (props.delayMs === 0 ? undefined : props.delayMs))
</script>

<template>
  <AvatarRoot
    data-slot="avatar"
    :class="
      cn(
        'relative flex size-10 shrink-0 overflow-hidden rounded-full bg-muted select-none',
        props.class,
      )
    "
  >
    <AvatarImage
      v-if="props.src"
      data-slot="avatar-image"
      :src="props.src"
      :alt="props.alt"
      class="size-full object-cover"
    />
    <AvatarFallback
      data-slot="avatar-fallback"
      :delay-ms="fallbackDelay"
      class="flex size-full items-center justify-center text-label text-muted-foreground"
    >
      <slot />
    </AvatarFallback>
  </AvatarRoot>
</template>
