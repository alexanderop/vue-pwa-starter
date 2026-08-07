<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'

const checked = defineModel<boolean>({ default: false })
</script>

<template>
  <SwitchRoot
    v-model="checked"
    data-slot="switch"
    class="peer inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
  >
    <SwitchThumb
      data-slot="switch-thumb"
      class="pointer-events-none block size-5 rounded-full bg-background shadow-lg transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5"
    />
  </SwitchRoot>
</template>
