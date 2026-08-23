<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Delete } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import AtomButton from '@/components/atoms/AtomButton.vue'
import { cn } from '@/lib/utils'
import { useNumericInputContext } from './numericInputContext'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { t } = useI18n()
const input = useNumericInputContext()
const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const
</script>

<template>
  <div
    data-slot="numeric-input-keypad"
    role="group"
    :aria-label="t('numericInput.keypad')"
    :class="cn('grid grid-cols-3 gap-2', props.class)"
  >
    <span class="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {{ input.state.value.fresh ? t('numericInput.replaceMode') : '' }}
    </span>

    <AtomButton
      v-for="digit in digits"
      :key="digit"
      data-slot="numeric-input-key"
      type="button"
      variant="secondary"
      class="h-14 text-xl font-semibold pointer-fine:h-12"
      :aria-label="digit"
      @click="input.dispatch({ type: 'digit', digit })"
    >
      {{ digit }}
    </AtomButton>

    <AtomButton
      v-if="input.options.value.maximumFractionDigits > 0"
      data-slot="numeric-input-key"
      type="button"
      variant="ghost"
      class="h-14 text-xl font-semibold pointer-fine:h-12"
      :aria-label="t('numericInput.decimal')"
      @click="input.dispatch({ type: 'decimal' })"
    >
      {{ input.decimalSeparator.value }}
    </AtomButton>
    <div v-else aria-hidden="true" />

    <AtomButton
      data-slot="numeric-input-key"
      type="button"
      variant="secondary"
      class="h-14 text-xl font-semibold pointer-fine:h-12"
      aria-label="0"
      @click="input.dispatch({ type: 'digit', digit: '0' })"
    >
      0
    </AtomButton>

    <AtomButton
      data-slot="numeric-input-key"
      type="button"
      variant="ghost"
      class="h-14 pointer-fine:h-12"
      :aria-label="t('numericInput.backspace')"
      @click="input.dispatch({ type: 'backspace' })"
    >
      <Delete aria-hidden="true" />
    </AtomButton>
  </div>
</template>
