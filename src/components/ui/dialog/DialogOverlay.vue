<script setup lang="ts">
import { DialogOverlay } from 'reka-ui'
</script>

<template>
  <DialogOverlay
    data-slot="dialog-overlay"
    class="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
  />
</template>
