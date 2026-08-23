<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const model = defineModel<string>({ default: '' })
</script>

<template>
  <input
    v-model="model"
    data-slot="input"
    :class="
      cn(
        'flex h-touch-target w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-raised transition-colors placeholder:text-muted-foreground focus-ring disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  />
</template>
