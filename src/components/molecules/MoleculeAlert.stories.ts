import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { CircleAlert, CircleCheck, Info, TriangleAlert } from '@lucide/vue'
import { expect, within } from 'storybook/test'
import { element } from '../../stories/support/dom'
import AtomButton from '@/components/atoms/AtomButton.vue'
import MoleculeAlert from './MoleculeAlert.vue'

const meta = {
  title: 'Components/Molecules/Alert',
  component: MoleculeAlert,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A message in place rather than over the top. The tone is a prop because these differ in colour and nothing else — but the ARIA role follows the tone, so `destructive` interrupts a screen reader and the others do not. A call site cannot take one without the other.',
      },
    },
  },
} satisfies Meta<typeof MoleculeAlert>

export default meta
type Story = StoryObj<typeof meta>

const components = { MoleculeAlert, AtomButton }

export const Tones: Story = {
  render: () => ({
    components,
    setup: () => ({ Info, CircleCheck, TriangleAlert, CircleAlert }),
    template: `
      <div class="mx-auto flex max-w-md flex-col gap-3">
        <MoleculeAlert tone="info">
          <template #icon><component :is="Info" class="size-4" aria-hidden="true" /></template>
          Your notes are stored on this device only.
        </MoleculeAlert>
        <MoleculeAlert tone="success">
          <template #icon><component :is="CircleCheck" class="size-4" aria-hidden="true" /></template>
          Backup imported. 24 notes restored.
        </MoleculeAlert>
        <MoleculeAlert tone="warning">
          <template #icon><component :is="TriangleAlert" class="size-4" aria-hidden="true" /></template>
          You are offline. Changes are saved locally and stay here.
        </MoleculeAlert>
        <MoleculeAlert tone="destructive">
          <template #icon><component :is="CircleAlert" class="size-4" aria-hidden="true" /></template>
          Your notes could not be saved.
        </MoleculeAlert>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('only the destructive tone interrupts', async () => {
      await expect(canvas.getAllByRole('alert')).toHaveLength(1)
      await expect(canvas.getByRole('alert')).toHaveTextContent('could not be saved')
      await expect(canvas.getAllByRole('status')).toHaveLength(3)
    })
  },
}

/** The action slot is where the way out goes — dismiss, or retry. */
export const WithAction: Story = {
  render: () => ({
    components,
    setup: () => ({ TriangleAlert }),
    template: `
      <MoleculeAlert tone="warning" class="mx-auto max-w-md">
        <template #icon><component :is="TriangleAlert" class="size-4" aria-hidden="true" /></template>
        Your last change was not written.
        <template #action><AtomButton size="sm" variant="outline">Retry</AtomButton></template>
      </MoleculeAlert>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Retry' })).toBeVisible()
  },
}

/**
 * Storage quota exceeded — the state a local-first app actually reaches, and
 * the one where a generic "something went wrong" is useless. It is reachable
 * through `src/lib/persistentStorage.ts`'s public contract.
 */
export const QuotaExceeded: Story = {
  render: () => ({
    components,
    setup: () => ({ CircleAlert }),
    template: `
      <MoleculeAlert tone="destructive" class="mx-auto max-w-md">
        <template #icon><component :is="CircleAlert" class="size-4" aria-hidden="true" /></template>
        <p class="font-medium">This device is out of space for notes</p>
        <p class="mt-1 text-footnote">Export a backup and delete a few notes to carry on. Nothing has been lost.</p>
        <template #action><AtomButton size="sm" variant="outline">Export</AtomButton></template>
      </MoleculeAlert>
    `,
  }),
  play: async ({ canvasElement }) => {
    // Announced without waiting for focus, because the write already failed.
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent('out of space')
  },
}

/** Long German copy, wrapping rather than pushing the action off the row. */
export const LongCopy: Story = {
  globals: { locale: 'de' },
  render: () => ({
    components,
    template: `
      <MoleculeAlert tone="warning" class="mx-auto max-w-md" data-testid="alert">
        Du bist offline. Deine Änderungen werden lokal gespeichert und bleiben auf diesem Gerät, bis du wieder verbunden bist.
        <template #action><AtomButton size="sm" variant="outline">OK</AtomButton></template>
      </MoleculeAlert>
    `,
  }),
  play: async ({ canvasElement }) => {
    const alert = element(canvasElement, '[data-testid="alert"]')

    await expect(alert.scrollWidth).toBeLessThanOrEqual(alert.clientWidth)
  },
}
