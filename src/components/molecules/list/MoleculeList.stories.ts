import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ChevronLeft, NotebookPen, Settings, Share } from '@lucide/vue'
import { expect, within } from 'storybook/test'
import { element } from '../../../stories/support/dom'
import AtomBadge from '@/components/atoms/AtomBadge.vue'
import AtomSpinner from '@/components/atoms/AtomSpinner.vue'
import AtomSwitch from '@/components/atoms/AtomSwitch.vue'
import { MoleculeList, MoleculeListRow, MoleculeListSection } from '.'

const subcomponents = { MoleculeListRow, MoleculeListSection }

const meta = {
  title: 'Components/Molecules/List',
  component: MoleculeList,
  subcomponents,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The most-used component in any mobile app: a card of hairline-separated rows. Four slots — leading, default (title), description, trailing — and `as` to decide whether a row presents something or goes somewhere.',
      },
    },
  },
} satisfies Meta<typeof MoleculeList>

export default meta
type Story = StoryObj<typeof meta>

const components = { MoleculeList, ...subcomponents, AtomBadge, AtomSwitch, ChevronLeft, Settings }

/** The plain case: rows that present a value and nothing else. */
export const Plain: Story = {
  render: () => ({
    components,
    template: `
      <MoleculeList class="mx-auto max-w-md">
        <MoleculeListRow>Version<template #trailing>0.1.0</template></MoleculeListRow>
        <MoleculeListRow>Storage<template #trailing>On this device</template></MoleculeListRow>
        <MoleculeListRow>Account<template #trailing>None</template></MoleculeListRow>
      </MoleculeList>
    `,
  }),
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole('list')

    // A real <ul>, so the count is announced. That is the whole reason not to
    // reach for a div with role="list".
    await expect(within(list).getAllByRole('listitem')).toHaveLength(3)
  },
}

export const LeadingAndTrailing: Story = {
  render: () => ({
    components,
    setup: () => ({ NotebookPen, Share }),
    template: `
      <MoleculeList class="mx-auto max-w-md">
        <MoleculeListRow>
          <template #leading><component :is="NotebookPen" class="size-5" aria-hidden="true" /></template>
          Notes
          <template #trailing><AtomBadge>12</AtomBadge></template>
        </MoleculeListRow>
        <MoleculeListRow>
          <template #leading><Settings class="size-5" aria-hidden="true" /></template>
          Appearance
          <template #trailing><AtomSwitch aria-label="Dark mode" /></template>
        </MoleculeListRow>
        <MoleculeListRow as="button" type="button">
          <template #leading><component :is="Share" class="size-5" aria-hidden="true" /></template>
          Export a backup
          <template #trailing><ChevronLeft class="size-4 rotate-180" aria-hidden="true" /></template>
        </MoleculeListRow>
      </MoleculeList>
    `,
  }),
}

/** Two lines, for when the title alone cannot carry the row's identity. */
export const TwoLine: Story = {
  render: () => ({
    components,
    template: `
      <MoleculeList class="mx-auto max-w-md">
        <MoleculeListRow>
          Import a backup
          <template #description>Replaces every note on this device</template>
        </MoleculeListRow>
        <MoleculeListRow>
          Export a backup
          <template #description>Downloads a JSON file you keep yourself</template>
        </MoleculeListRow>
      </MoleculeList>
    `,
  }),
}

export const Sectioned: Story = {
  render: () => ({
    components,
    template: `
      <div class="mx-auto flex max-w-md flex-col gap-section">
        <MoleculeListSection>
          <template #heading><h2 class="text-section-title font-semibold">Appearance</h2></template>
          <MoleculeList>
            <MoleculeListRow>Dark mode<template #trailing><AtomSwitch aria-label="Dark mode" /></template></MoleculeListRow>
          </MoleculeList>
        </MoleculeListSection>
        <MoleculeListSection>
          <template #heading><h2 class="text-section-title font-semibold">Data</h2></template>
          <MoleculeList>
            <MoleculeListRow as="button" type="button">Export<template #trailing>JSON</template></MoleculeListRow>
            <MoleculeListRow as="button" type="button">Import<template #trailing>JSON</template></MoleculeListRow>
          </MoleculeList>
        </MoleculeListSection>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getAllByRole('list')).toHaveLength(2)
    await expect(canvas.getByRole('heading', { name: 'Appearance', level: 2 })).toBeVisible()
  },
}

/**
 * A row that goes somewhere takes a press; a row that only presents something
 * does not. `as` is the switch, so a static row cannot be made to look
 * tappable by forgetting a flag.
 */
export const PressedAndStatic: Story = {
  render: () => ({
    components,
    template: `
      <MoleculeList class="mx-auto max-w-md">
        <MoleculeListRow data-testid="static">Static row<template #trailing>No action</template></MoleculeListRow>
        <MoleculeListRow as="button" type="button" data-testid="pressable">Pressable row</MoleculeListRow>
        <MoleculeListRow as="button" type="button" disabled data-testid="disabled">Disabled row</MoleculeListRow>
      </MoleculeList>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    const static_ = element(canvasElement, '[data-testid="static"]')
    const pressable = element(canvasElement, '[data-testid="pressable"]')

    await step('only the interactive row is a control', async () => {
      await expect(canvas.getAllByRole('button')).toHaveLength(2)
      await expect(static_.tagName).toBe('DIV')
      await expect(pressable.tagName).toBe('BUTTON')
    })

    await step('the static row has no transition to hint at one', async () => {
      // `[&:is(a,button)]:` is the switch, so this is the assertion that
      // fails if the press branch is ever moved onto every row.
      await expect(globalThis.getComputedStyle(static_).transitionProperty).toBe('all')
      await expect(globalThis.getComputedStyle(pressable).transitionProperty).toContain('color')
    })

    await step('a disabled row takes neither a tap nor focus', async () => {
      const disabled = canvas.getByRole('button', { name: 'Disabled row' })

      await expect(disabled).toBeDisabled()
      // Not `userEvent.click`: it refuses to act on `pointer-events: none`,
      // which is the state under test. Assert the state itself.
      await expect(globalThis.getComputedStyle(disabled).pointerEvents).toBe('none')
      disabled.focus()
      await expect(disabled).not.toHaveFocus()
    })
  },
}

/**
 * A row whose write has not landed yet.
 *
 * In a local-first app this window is short but real: the note is on screen
 * because the UI wrote it optimistically, and IndexedDB has not confirmed. The
 * row stays fully legible and fully interactive — dimming it or replacing it
 * with a skeleton says "this might not be yours", which is the opposite of the
 * promise the app makes.
 *
 * The pending marker is a `status`, not an `alert`: nothing has gone wrong,
 * and a screen reader should hear about it when it gets there rather than
 * being interrupted. `AtomSpinner` already is one — wrapping it in a second
 * `role="status"` is two live regions announcing the same thing.
 */
export const WritePending: Story = {
  render: () => ({
    components,
    setup: () => ({ Spinner: AtomSpinner }),
    template: `
      <MoleculeList class="mx-auto max-w-md">
        <MoleculeListRow>Pack charger<template #trailing>2 min</template></MoleculeListRow>
        <MoleculeListRow data-testid="pending">
          Water the plants
          <template #trailing>
            <span class="flex items-center gap-2 text-caption">
              <component :is="Spinner" class="size-4" />
              Saving
            </span>
          </template>
        </MoleculeListRow>
      </MoleculeList>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const pending = element(canvasElement, '[data-testid="pending"]')

    await step('it announces politely rather than interrupting', async () => {
      // One live region, the spinner's own. `alert` would interrupt, and
      // nothing here has gone wrong.
      await expect(canvas.getAllByRole('status')).toHaveLength(1)
      await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
      await expect(pending).toHaveTextContent('Saving')
    })

    await step("the row is not dimmed — the note is already the user's", async () => {
      await expect(globalThis.getComputedStyle(pending).opacity).toBe('1')
    })
  },
}

/**
 * The failure this component exists to prevent: a long title pushing the
 * trailing control off the screen instead of ellipsing.
 */
export const LongLabels: Story = {
  render: () => ({
    components,
    template: `
      <MoleculeList class="mx-auto max-w-md">
        <MoleculeListRow data-testid="long" as="button" type="button">
          Sicherungskopie aller lokal gespeicherten Notizen exportieren
          <template #description>Erstellt eine JSON-Datei, die Sie selbst aufbewahren</template>
          <template #trailing><ChevronLeft class="size-4 rotate-180" aria-hidden="true" /></template>
        </MoleculeListRow>
      </MoleculeList>
    `,
  }),
  play: async ({ canvasElement }) => {
    const row = element(canvasElement, '[data-testid="long"]')
    const trailing = element(canvasElement, '[data-slot="list-row-trailing"]')
    const title = element(canvasElement, '[data-slot="list-row-text"] > span')

    // The chevron stays inside the row, and the title is what gave way.
    await expect(trailing.getBoundingClientRect().right).toBeLessThanOrEqual(
      row.getBoundingClientRect().right,
    )
    await expect(title.scrollWidth).toBeGreaterThan(title.clientWidth)
  },
}
