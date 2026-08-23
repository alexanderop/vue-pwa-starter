import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NotebookPen, Search, Trash2 } from '@lucide/vue'
import { expect, within } from 'storybook/test'
import { element } from '../../stories/support/dom'
import AtomButton from '@/components/atoms/AtomButton.vue'
import MoleculeEmptyState from './MoleculeEmptyState.vue'

const meta = {
  title: 'Components/Molecules/Empty state',
  component: MoleculeEmptyState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Four states that differ in their words rather than their shape: nothing yet, nothing matched, nothing loaded, and nothing left. Each one owes the user a way out, which is what the action slot is for.',
      },
    },
  },
} satisfies Meta<typeof MoleculeEmptyState>

export default meta
type Story = StoryObj<typeof meta>

const components = { MoleculeEmptyState, AtomButton }

/** First run — the first screen a local-first app ever shows. */
export const FirstRun: Story = {
  render: () => ({
    components,
    setup: () => ({ NotebookPen }),
    template: `
      <MoleculeEmptyState>
        <template #icon><component :is="NotebookPen" class="size-6" aria-hidden="true" /></template>
        No notes yet
        <template #description>Tap the + button to capture your first note. Everything stays on this device.</template>
      </MoleculeEmptyState>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('No notes yet')).toBeVisible()
    // The icon is decoration and says nothing an assistive technology needs.
    await expect(canvasElement.querySelector('[data-slot="empty-state-icon"] svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  },
}

/**
 * Filtered to empty. Different from first run in the only way that matters:
 * the data exists, the filter is what is hiding it, and the way out is to
 * clear the filter rather than to create something.
 */
export const FilteredToEmpty: Story = {
  render: () => ({
    components,
    setup: () => ({ Search }),
    template: `
      <MoleculeEmptyState>
        <template #icon><component :is="Search" class="size-6" aria-hidden="true" /></template>
        No notes match “grocery”
        <template #description>Try a shorter search, or clear it to see all 24 notes.</template>
        <template #action><AtomButton variant="outline">Clear search</AtomButton></template>
      </MoleculeEmptyState>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Clear search' })).toBeVisible()
  },
}

/** Something broke. The retry is the point; the apology is not. */
export const LoadFailed: Story = {
  render: () => ({
    components,
    template: `
      <MoleculeEmptyState>
        Your notes could not be read
        <template #description>The local database did not open. Reloading usually fixes it.</template>
        <template #action><AtomButton>Try again</AtomButton></template>
      </MoleculeEmptyState>
    `,
  }),
}

/** Nothing left, which is a success rather than a failure. */
export const NothingLeft: Story = {
  render: () => ({
    components,
    setup: () => ({ Trash2 }),
    template: `
      <MoleculeEmptyState>
        <template #icon><component :is="Trash2" class="size-6" aria-hidden="true" /></template>
        Trash is empty
      </MoleculeEmptyState>
    `,
  }),
}

/**
 * Long German copy at 320px — the narrowest viewport the catalog offers, and
 * the one an empty state fails on first, because its text is centred and
 * unconstrained.
 */
export const NarrowAndTranslated: Story = {
  globals: { locale: 'de', viewport: { value: 'compactMobile', isRotated: false } },
  render: () => ({
    components,
    setup: () => ({ NotebookPen }),
    template: `
      <MoleculeEmptyState data-testid="empty">
        <template #icon><component :is="NotebookPen" class="size-6" aria-hidden="true" /></template>
        Noch keine Notizen
        <template #description>Tippe auf die Plus-Schaltfläche, um deine erste Notiz zu erfassen. Alles bleibt auf diesem Gerät.</template>
      </MoleculeEmptyState>
    `,
  }),
  play: async ({ canvasElement }) => {
    const empty = element(canvasElement, '[data-testid="empty"]')

    // Nothing overflows sideways: the description is width-capped and wraps.
    await expect(empty.scrollWidth).toBeLessThanOrEqual(empty.clientWidth)
  },
}
