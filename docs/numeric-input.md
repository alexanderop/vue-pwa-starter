---
type: Reference
title: Numeric input
description: How to compose the swipeable numeric drawer for fast, transactional number entry on touch devices and physical keyboards.
tags: [ui, mobile, touch, input, drawer, accessibility]
status: stable
---

# Numeric input

`src/components/molecules/numeric-input/` is a generic numeric editor for the
kind of repeated entry where a phone's inconsistent software keyboard is the
slow path: weights, repetitions, distances, serving sizes, timers. It is not a
weight component. Units, constraints, suggested values and domain-specific
hints all come from the consumer.

The editor is transactional. Opening copies the committed value into a draft;
keypad and preset presses change only that draft; Confirm commits and Cancel,
Escape, an outside press or a downward swipe discard it. The first digit
replaces the existing value, calculator-style. A physical keyboard can use
digits, comma or period, Backspace/Delete and Enter.

## Composition

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  MoleculeNumericInput,
  MoleculeNumericInputBody,
  MoleculeNumericInputCancel,
  MoleculeNumericInputConfirm,
  MoleculeNumericInputContent,
  MoleculeNumericInputControls,
  MoleculeNumericInputDescription,
  MoleculeNumericInputDisplay,
  MoleculeNumericInputHandle,
  MoleculeNumericInputHeader,
  MoleculeNumericInputKeypad,
  MoleculeNumericInputPresets,
  MoleculeNumericInputTitle,
  MoleculeNumericInputTrigger,
} from '@/components/molecules/numeric-input'

const weight = ref(20)
</script>

<template>
  <MoleculeNumericInput
    v-model="weight"
    :options="{
      min: 0,
      max: 500,
      maximumFractionDigits: 2,
      presetStep: 2.5,
      presetRange: 10,
    }"
  >
    <MoleculeNumericInputTrigger aria-label="Edit weight" unit="kg" />

    <MoleculeNumericInputContent>
      <MoleculeNumericInputHandle />
      <MoleculeNumericInputBody>
        <MoleculeNumericInputHeader>
          <MoleculeNumericInputCancel />
          <MoleculeNumericInputTitle>Weight</MoleculeNumericInputTitle>
          <span aria-hidden="true" />
        </MoleculeNumericInputHeader>
        <MoleculeNumericInputDescription>
          Choose a suggested weight or enter one with the keypad.
        </MoleculeNumericInputDescription>

        <MoleculeNumericInputPresets unit="kg" />

        <MoleculeNumericInputControls>
          <div class="flex items-center gap-3">
            <MoleculeNumericInputDisplay unit="kg" />
            <MoleculeNumericInputConfirm />
          </div>
          <MoleculeNumericInputKeypad />
        </MoleculeNumericInputControls>
      </MoleculeNumericInputBody>
    </MoleculeNumericInputContent>
  </MoleculeNumericInput>
</template>
```

The title and description are required: Reka Drawer connects their IDs to the
dialog's accessible name and description. The handle is truthful—Reka owns the
downward swipe gesture on the content rather than drawing a decorative pill.

## Configuration

`options` is one object so it can be passed through a feature boundary without
turning the primitive into a wall of flags:

| Option                  | Meaning                                              | Default |
| ----------------------- | ---------------------------------------------------- | ------- |
| `min`                   | Smallest committed value; negative input is excluded | `0`     |
| `max`                   | Largest entered or committed value                   | `999`   |
| `maximumFractionDigits` | Decimal digits accepted by the keypad                | `0`     |
| `presetStep`            | Distance between generated suggestions               | `1`     |
| `presetRange`           | Distance generated either side of the draft          | `10`    |

Pass `:presets="[…]"` to replace generated suggestions. Values outside the
configured range are discarded and duplicates are removed. `MoleculeNumericInputDisplay`
also exposes `#hint="{ value }"`; a workout feature can render a plate hint
there without teaching the shared component what a barbell is.

The pure editing state machine is `src/lib/numericInput.ts`. Change its rules
there and pin boundaries in `src/__tests__/unit/lib/numericInput.spec.ts`; keep
focus, Drawer, keyboard and touch geometry in their browser tiers.
