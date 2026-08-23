<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Search, X } from '@lucide/vue'
import { computed } from 'vue'
import AtomButton from '@/components/atoms/AtomButton.vue'
import AtomInput from '@/components/atoms/AtomInput.vue'
import { cn } from '@/lib/utils'

/**
 * A search field with the clear button a phone needs.
 *
 * `type="search"` and not `type="text"`: it is what makes an iOS keyboard show
 * a "Search" return key, and what lets a screen reader call the field a search
 * box. The native clear affordance that comes with it is suppressed, because
 * it is a ~12px target on iOS, and replaced by a 44px button.
 *
 * That button renders only when there is something to clear. A permanently
 * visible × on an empty field is a control that does nothing, and on a 320px
 * screen it also eats the space the placeholder needs.
 *
 * `enterkeyhint="search"` is separate from `type` and is the half most
 * implementations forget.
 */
const props = defineProps<{
  class?: HTMLAttributes['class']
  /** The accessible name. A search field with a placeholder and no label is unlabelled. */
  label: string
  placeholder?: string
  clearLabel?: string
}>()

const model = defineModel<string>({ default: '' })

const hasValue = computed(() => model.value.length > 0)

function clear(): void {
  model.value = ''
}
</script>

<template>
  <div data-slot="search-field" :class="cn('relative flex w-full items-center', props.class)">
    <Search
      class="pointer-events-none absolute left-3 z-(--z-sticky) size-4 shrink-0 text-muted-foreground"
      aria-hidden="true"
    />

    <AtomInput
      v-model="model"
      data-slot="search-field-input"
      type="search"
      enterkeyhint="search"
      autocomplete="off"
      autocorrect="off"
      spellcheck="false"
      :aria-label="props.label"
      :placeholder="props.placeholder"
      class="rounded-full pr-12 pl-9 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
    />

    <AtomButton
      v-if="hasValue"
      variant="ghost"
      size="icon"
      data-slot="search-field-clear"
      :aria-label="props.clearLabel ?? `Clear ${props.label}`"
      class="absolute right-1 rounded-full text-muted-foreground"
      @click="clear"
    >
      <X aria-hidden="true" />
    </AtomButton>
  </div>
</template>
